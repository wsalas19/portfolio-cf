// Benchmark reproducible de las dos versiones desplegadas.
// Corre Lighthouse (mobile y desktop) y guarda los promedios por caso.
//
//   pnpm bench                 # 3 mobile / 2 desktop por sitio
//   BENCH_RUNS=1 pnpm bench    # pasada rápida
//
// Requiere Chrome instalado. Los reportes crudos quedan en benchmark/raw/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

process.env.CHROME_PATH ||= "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "benchmark", "raw");
fs.mkdirSync(rawDir, { recursive: true });

const SITES = [
	{ name: "vercel", base: "https://www.wsalas.com" },
	{ name: "cloudflare", base: "https://portfolio-cf.wsalas.workers.dev" },
];

const CASES = [
	{ name: "home", path: "/", form: "mobile", runs: 3 },
	{ name: "home", path: "/", form: "desktop", runs: 2 },
	{
		name: "blog-post",
		path: "/blog/php2shell-colombia-2026",
		form: "mobile",
		runs: 2,
	},
	{ name: "visor", path: "/visor-credito", form: "mobile", runs: 2 },
];

const override = Number(process.env.BENCH_RUNS) || null;
const CHROME_FLAGS = [
	"--headless=new",
	"--no-sandbox",
	"--disable-gpu",
	"--disable-dev-shm-usage",
];

function num(lhr, id) {
	const value = lhr.audits[id]?.numericValue;
	return typeof value === "number" ? Math.round(value * 100) / 100 : null;
}

function extract(lhr) {
	const summary = lhr.audits["resource-summary"]?.details?.items ?? [];
	const resources = {};
	for (const item of summary) {
		resources[item.resourceType] = {
			requests: item.requestCount ?? null,
			bytes: item.transferSize ?? null,
		};
	}

	return {
		performance:
			typeof lhr.categories.performance?.score === "number"
				? Math.round(lhr.categories.performance.score * 100)
				: null,
		ttfb: num(lhr, "server-response-time"),
		fcp: num(lhr, "first-contentful-paint"),
		lcp: num(lhr, "largest-contentful-paint"),
		tbt: num(lhr, "total-blocking-time"),
		cls: Math.round((lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0) * 1000) / 1000,
		speedIndex: num(lhr, "speed-index"),
		interactive: num(lhr, "interactive"),
		totalBytes: num(lhr, "total-byte-weight"),
		requests: lhr.audits["network-requests"]?.details?.items?.length ?? null,
		resources,
		lcpElement:
			lhr.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet ??
			null,
	};
}

async function run(site, testCase, index) {
	const chrome = await chromeLauncher.launch({ chromeFlags: CHROME_FLAGS });
	try {
		const flags = {
			port: chrome.port,
			output: "json",
			onlyCategories: ["performance"],
			logLevel: "error",
		};
		const config = testCase.form === "desktop" ? desktopConfig : undefined;
		const result = await lighthouse(site.base + testCase.path, flags, config);
		if (!result?.lhr) throw new Error("Lighthouse did not return a result");

		const rawName = `${site.name}-${testCase.name}-${testCase.form}-${index + 1}.json`;
		fs.writeFileSync(path.join(rawDir, rawName), JSON.stringify(result.lhr));
		return extract(result.lhr);
	} finally {
		await chrome.kill();
	}
}

function median(values) {
	const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
	if (nums.length === 0) return null;
	nums.sort((a, b) => a - b);
	const mid = Math.floor(nums.length / 2);
	return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

function summarize(runs) {
	const keys = [
		"performance",
		"ttfb",
		"fcp",
		"lcp",
		"tbt",
		"cls",
		"speedIndex",
		"interactive",
		"totalBytes",
		"requests",
	];
	const out = Object.fromEntries(keys.map((key) => [key, median(runs.map((r) => r[key]))]));

	const types = new Set(runs.flatMap((r) => Object.keys(r.resources)));
	out.resources = {};
	for (const type of types) {
		out.resources[type] = {
			requests: median(runs.map((r) => r.resources[type]?.requests ?? null)),
			bytes: median(runs.map((r) => r.resources[type]?.bytes ?? null)),
		};
	}

	out.lcpElement = runs[0]?.lcpElement ?? null;
	return out;
}

const results = {
	generatedAt: new Date().toISOString(),
	sites: SITES,
	cases: [],
};

for (const testCase of CASES) {
	const runs = override ?? testCase.runs;
	const bySite = Object.fromEntries(SITES.map((site) => [site.name, []]));

	for (let index = 0; index < runs; index++) {
		for (const site of SITES) {
			let metrics;
			try {
				metrics = await run(site, testCase, index);
			} catch (error) {
				console.error(
					`[bench] ${site.name} ${testCase.name} ${testCase.form} run ${index + 1} failed:`,
					error,
				);
				continue;
			}
			bySite[site.name].push(metrics);
			console.log(
				`[bench] ${site.name.padEnd(10)} ${(testCase.name + "-" + testCase.form).padEnd(18)} ` +
					`score=${metrics.performance} lcp=${Math.round(metrics.lcp)}ms ` +
					`tbt=${Math.round(metrics.tbt)}ms cls=${metrics.cls} ttfb=${Math.round(metrics.ttfb)}ms`,
			);
		}
	}

	results.cases.push({
		case: testCase.name,
		path: testCase.path,
		formFactor: testCase.form,
		runs,
		sites: Object.fromEntries(
			SITES.map((site) => [site.name, summarize(bySite[site.name])]),
		),
	});
}

const outFile = path.join(root, "benchmark", "results.json");
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

console.log("\n=== Medianas ===");
for (const item of results.cases) {
	for (const site of SITES) {
		const m = item.sites[site.name];
		console.log(
			`${site.name.padEnd(10)} ${(item.case + "-" + item.formFactor).padEnd(18)} ` +
				`score=${m.performance} lcp=${Math.round(m.lcp)}ms tbt=${Math.round(m.tbt)}ms ` +
				`cls=${m.cls} ttfb=${Math.round(m.ttfb)}ms ` +
				`total=${Math.round(m.totalBytes / 1024)}KB req=${m.requests}`,
		);
	}
}
console.log(`\nGuardado en ${outFile}`);

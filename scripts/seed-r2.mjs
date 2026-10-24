// Sube el contenido inicial del repo a R2. Idempotente: se puede correr varias
// veces; los objetos se sobrescriben.
//
//   node scripts/seed-r2.mjs --local    # Miniflare local
//   node scripts/seed-r2.mjs --remote   # bucket real de Cloudflare
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const local = process.argv.includes("--local");
if (!local && !process.argv.includes("--remote")) {
	console.error("Uso: node scripts/seed-r2.mjs --local|--remote");
	process.exit(1);
}

const BUCKET = "portfolio-cf-content";
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const config = path.join(root, "wrangler.jsonc");

const TYPES = {
	".md": "text/markdown; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
};

function walk(dir) {
	if (!fs.existsSync(dir)) return [];
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (TYPES[path.extname(entry.name).toLowerCase()]) out.push(full);
	}
	return out;
}

function keyFor(file) {
	const relative = path.relative(root, file).split(path.sep).join("/");
	return relative.startsWith("public/") ? relative.slice("public/".length) : relative;
}

const files = [
	...walk(path.join(root, "content", "blog")),
	...walk(path.join(root, "content", "legal")),
	...walk(path.join(root, "public", "images", "blog")),
];

let uploaded = 0;
for (const file of files) {
	const key = keyFor(file);
	const contentType = TYPES[path.extname(file).toLowerCase()];
	const args = [
		"r2",
		"object",
		"put",
		`${BUCKET}/${key}`,
		"--file",
		file,
		"--content-type",
		contentType,
		"--config",
		config,
		"--persist-to",
		path.join(root, ".wrangler", "state"),
		local ? "--local" : "--remote",
	];

	const result = spawnSync(process.execPath, [wrangler, ...args], {
		cwd: root,
		stdio: "inherit",
	});

	if (result.status !== 0) {
		console.error(`\n[seed] falló ${key}`);
		process.exit(result.status ?? 1);
	}
	uploaded++;
}

console.log(`\n[seed] ${uploaded} objetos subidos a ${BUCKET} (${local ? "local" : "remote"})`);

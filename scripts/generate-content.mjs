// Genera el manifiesto de contenido que consume el runtime. Se ejecuta antes
// de `dev`/`build` (y en `prepare`) para que las rutas no dependan de `fs`,
// que no existe en Cloudflare Workers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "generated");
const outFile = path.join(outDir, "content.json");

const IMAGE_RE = /\.(png|jpe?g|webp|avif)$/i;

function readingTime(content) {
	return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

function normalizeDate(value) {
	return new Date(value).toISOString().slice(0, 10);
}

function markdownFiles(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".md") || name.endsWith(".mdx"));
}

function readPosts() {
	const dir = path.join(root, "content", "blog");
	const posts = markdownFiles(dir).map((name) => {
		const slug = name.replace(/\.(md|mdx)$/, "");
		const { data, content } = matter(fs.readFileSync(path.join(dir, name), "utf8"));
		return {
			slug,
			title: data.title,
			date: normalizeDate(data.date),
			excerpt: data.excerpt,
			content,
			tags: data.tags || [],
			author: data.author || "William Salas",
			readingTime: readingTime(content),
		};
	});

	return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function readLegal() {
	const dir = path.join(root, "content", "legal");
	const docs = {};

	for (const name of markdownFiles(dir)) {
		const slug = name.replace(/\.(md|mdx)$/, "");
		const { data, content } = matter(fs.readFileSync(path.join(dir, name), "utf8"));
		docs[slug] = {
			title: data.title,
			excerpt: data.excerpt,
			content,
		};
	}

	return docs;
}

function readGalleries() {
	const dir = path.join(root, "public", "images", "projects");
	const galleries = {};
	if (!fs.existsSync(dir)) return galleries;

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		galleries[entry.name] = fs
			.readdirSync(path.join(dir, entry.name))
			.filter((file) => IMAGE_RE.test(file))
			.sort()
			.map((file) => `/images/projects/${entry.name}/${file}`);
	}

	return galleries;
}

const content = {
	posts: readPosts(),
	legal: readLegal(),
	galleries: readGalleries(),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(content));

console.log(
	`[content] ${content.posts.length} posts, ` +
		`${Object.keys(content.legal).length} legal docs, ` +
		`${Object.keys(content.galleries).length} galleries`,
);

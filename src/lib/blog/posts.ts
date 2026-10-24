import "server-only"; // el contenido se resuelve en el servidor, nunca en el cliente.

import { unstable_cache } from "next/cache";
import matter from "gray-matter";
import generated from "@/lib/generated/content.json";
import { contentBucket } from "@/lib/content/r2";
import type { BlogPost } from "./types";

// El contenido vive en R2 (`content/blog/<slug>.md`). El manifiesto generado en
// build queda como fallback para el prerender y para un R2 vacío en local.
const PREFIX = "content/blog/";

function parsePost(key: string, raw: string): BlogPost {
	const slug = key.slice(PREFIX.length).replace(/\.md$/, "");
	const { data, content } = matter(raw);
	const words = content.trim().split(/\s+/).length;

	return {
		slug,
		title: data.title,
		date: new Date(data.date).toISOString().slice(0, 10),
		excerpt: data.excerpt,
		content,
		tags: data.tags || [],
		author: data.author || "William Salas",
		readingTime: Math.max(1, Math.ceil(words / 200)),
	};
}

async function loadPosts(): Promise<BlogPost[]> {
	const bucket = contentBucket();
	if (!bucket) return generated.posts as BlogPost[];

	const keys: string[] = [];
	let cursor: string | undefined;
	do {
		const page = await bucket.list({ prefix: PREFIX, cursor });
		keys.push(
			...page.objects
				.map((object) => object.key)
				.filter((key) => key.endsWith(".md")),
		);
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);

	if (keys.length === 0) return generated.posts as BlogPost[];

	const posts = await Promise.all(
		keys.map(async (key) => {
			const object = await bucket.get(key);
			return object ? parsePost(key, await object.text()) : null;
		}),
	);

	return posts
		.filter((post): post is BlogPost => post !== null)
		.sort((a, b) => b.date.localeCompare(a.date));
}

async function loadPost(slug: string): Promise<BlogPost | null> {
	const bucket = contentBucket();
	if (!bucket) {
		return (generated.posts as BlogPost[]).find((post) => post.slug === slug) ?? null;
	}

	const key = `${PREFIX}${slug}.md`;
	const object = await bucket.get(key);
	if (!object) {
		return (generated.posts as BlogPost[]).find((post) => post.slug === slug) ?? null;
	}

	return parsePost(key, await object.text());
}

export const getAllPosts = unstable_cache(loadPosts, ["content-posts"], {
	tags: ["content"],
	revalidate: 3600,
});

export const getPostBySlug = unstable_cache(loadPost, ["content-post"], {
	tags: ["content"],
	revalidate: 3600,
});

export async function getAllPostSlugs(): Promise<string[]> {
	return (await getAllPosts()).map((post) => post.slug);
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
	return (await getAllPosts()).filter((post) =>
		post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase()),
	);
}

export async function getAllTags(): Promise<string[]> {
	const tags = new Set<string>();
	for (const post of await getAllPosts()) {
		for (const tag of post.tags) tags.add(tag);
	}
	return Array.from(tags).sort();
}

import "server-only"; // el contenido se resuelve en el build, no en el cliente.

import generated from "@/lib/generated/content.json";
import type { BlogPost } from "./types";

// `scripts/generate-content.mjs` deja el manifiesto listo antes de dev/build.
// Así el runtime no toca `fs` y el mismo contenido funciona en Workers.
const posts = generated.posts as BlogPost[];

export function getAllPostSlugs(): string[] {
	return posts.map((post) => post.slug);
}

export function getPostBySlug(slug: string): BlogPost | null {
	return posts.find((post) => post.slug === slug) ?? null;
}

export function getAllPosts(): BlogPost[] {
	// El manifiesto ya viene ordenado de más reciente a más antiguo.
	return posts;
}

export function getPostsByTag(tag: string): BlogPost[] {
	return posts.filter((post) =>
		post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase()),
	);
}

export function getAllTags(): string[] {
	const tags = new Set<string>();
	for (const post of posts) {
		for (const tag of post.tags) tags.add(tag);
	}
	return Array.from(tags).sort();
}

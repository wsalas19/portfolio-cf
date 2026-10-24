// Carga de los documentos legales. En producción viven en R2
// (`content/legal/<slug>.md`); el manifiesto de build queda como fallback.
import "server-only";

import { unstable_cache } from "next/cache";
import matter from "gray-matter";
import generated from "@/lib/generated/content.json";
import { contentBucket } from "@/lib/content/r2";

export type LegalSlug = "privacidad" | "terminos";

export type LegalDoc = {
	slug: LegalSlug;
	title: string;
	excerpt: string;
	content: string;
};

const PREFIX = "content/legal/";

const fallback = generated.legal as Record<
	string,
	{ title: string; excerpt: string; content: string }
>;

async function loadLegal(slug: LegalSlug): Promise<LegalDoc | null> {
	const bucket = contentBucket();
	const key = `${PREFIX}${slug}.md`;
	const object = bucket ? await bucket.get(key) : null;

	if (!object) {
		const doc = fallback[slug];
		return doc ? { slug, ...doc } : null;
	}

	const { data, content } = matter(await object.text());
	return {
		slug,
		title: data.title,
		excerpt: data.excerpt,
		content,
	};
}

export const getLegalDoc = unstable_cache(loadLegal, ["content-legal"], {
	tags: ["content"],
	revalidate: 3600,
});

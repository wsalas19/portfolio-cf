// Carga de los documentos legales desde el manifiesto generado en build.
// Server-only: el contenido no se bundlea al cliente.

import "server-only";

import generated from "@/lib/generated/content.json";

export type LegalSlug = "privacidad" | "terminos";

export type LegalDoc = {
	slug: LegalSlug;
	title: string;
	excerpt: string;
	content: string;
};

const legal = generated.legal as Record<
	string,
	{ title: string; excerpt: string; content: string }
>;

export function getLegalDoc(slug: LegalSlug): LegalDoc | null {
	const doc = legal[slug];
	return doc ? { slug, ...doc } : null;
}

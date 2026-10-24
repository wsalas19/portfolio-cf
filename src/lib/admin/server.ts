// Puente entre las rutas de /api/admin y R2. El navegador nunca ve el binding:
// todas las lecturas y escrituras salen del servidor.
//
// El `sha` que devuelve la lectura es el ETag del objeto en R2. Guardar con un
// ETag viejo usa `onlyIf.etagMatches` y devuelve 409 en vez de pisar un cambio
// ajeno; el mismo bloqueo optimista que antes daba GitHub.
import "server-only";

import matter from "gray-matter";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { Logger } from "@/lib/logger";
import { cleanEtag, contentBucket } from "@/lib/content/r2";

export class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

function storage() {
	const bucket = contentBucket();
	if (!bucket) throw new HttpError(503, "Content storage is not configured");
	return bucket;
}

async function listAll(prefix: string) {
	const bucket = storage();
	const keys: string[] = [];
	let cursor: string | undefined;

	do {
		const page = await bucket.list({ prefix, cursor });
		keys.push(...page.objects.map((object) => object.key));
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);

	return keys;
}

export function json(body: unknown, status = 200): NextResponse {
	// Nada de esto puede quedar en caché: son datos por usuario.
	return NextResponse.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

/**
 * El `Origin` tiene que ser el del propio sitio. Se compara contra el host de
 * la petición y no contra `NEXT_PUBLIC_SITE_URL`: esa variable apuntaba al apex
 * mientras el sitio canonicaliza en www, así que *todo* guardado daba 403 en
 * producción y funcionaba en local — el peor reparto posible para un fallo.
 */
export function isAllowedOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
	if (!origin || !host) return false;

	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}

export function cookieValue(request: Request, name: string): string | undefined {
	const header = request.headers.get("cookie");
	if (!header) return undefined;

	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return undefined;
}

/**
 * Guarda de las rutas de admin. Devuelve la respuesta de error, o `null` si la
 * petición puede seguir. En los métodos que mutan se valida también el `Origin`.
 */
export function requireAdmin(request: Request, method: string): NextResponse | null {
	if (method !== "GET" && method !== "HEAD" && !isAllowedOrigin(request)) {
		return json({ error: "Forbidden" }, 403);
	}

	const session = cookieValue(request, SESSION_COOKIE);
	if (!verifySession(session, env.ADMIN_SECRET)) {
		return json({ error: "Unauthorized" }, 401);
	}

	return null;
}

export async function contentList(dir: string): Promise<{ name: string; path: string }[]> {
	const keys = await listAll(`${dir}/`);
	return keys
		.filter((key) => key.endsWith(".md"))
		.map((key) => ({ name: key.slice(dir.length + 1), path: key }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function contentRead(path: string): Promise<{ sha: string; raw: string }> {
	const bucket = storage();
	const object = await bucket.get(path);
	if (!object) throw new HttpError(404, "Not found");

	return {
		sha: cleanEtag(object.etag ?? object.httpEtag),
		raw: await object.text(),
	};
}

function revalidateContent(): void {
	revalidateTag("content", "max");
}

export async function contentSave(
	path: string,
	raw: string,
	sha: string,
): Promise<{ sha: string }> {
	const bucket = storage();
	const object = await bucket.put(path, raw, {
		onlyIf: { etagMatches: sha },
		httpMetadata: { contentType: "text/markdown; charset=utf-8" },
	});

	if (!object) throw new HttpError(409, "Conflict");
	revalidateContent();
	return { sha: cleanEtag(object.etag ?? object.httpEtag) };
}

export async function contentCreate(path: string, raw: string): Promise<{ sha: string }> {
	const bucket = storage();
	if (await bucket.head(path)) {
		throw new HttpError(409, "A file with that name already exists");
	}

	const object = await bucket.put(path, raw, {
		httpMetadata: { contentType: "text/markdown; charset=utf-8" },
	});
	if (!object) throw new HttpError(500, "Could not create the file");

	revalidateContent();
	return { sha: cleanEtag(object.etag ?? object.httpEtag) };
}

export async function contentDelete(path: string): Promise<void> {
	const bucket = storage();
	if (!(await bucket.head(path))) throw new HttpError(404, "Not found");
	await bucket.delete(path);
	revalidateContent();
}

/**
 * Imágenes de un post, leídas de su carpeta en R2. Misma convención que
 * `galleryFor` de `src/lib/project-images.ts`.
 */
export async function contentImages(slug: string): Promise<string[]> {
	const prefix = `images/blog/${slug}/`;
	const keys = await listAll(prefix);

	return keys
		.filter((key) => /\.(png|jpe?g|webp|avif)$/i.test(key))
		.sort((a, b) => a.localeCompare(b))
		.map((key) => `/${key}`);
}

export async function contentUpload(
	path: string,
	bytes: ArrayBuffer,
	contentType: string,
): Promise<void> {
	const bucket = storage();
	await bucket.put(path, bytes, { httpMetadata: { contentType } });
}

/**
 * Un frontmatter que no parsea o sin `title` rompe el blog entero, no solo esa
 * página. Se valida con gray-matter antes de escribir, para que el error se vea
 * en el editor y no en el runtime.
 */
export function assertValidDoc(raw: string): void {
	let data: Record<string, unknown>;
	try {
		data = matter(raw).data;
	} catch {
		throw new HttpError(400, "Invalid frontmatter: check the block between ---");
	}

	if (typeof data.title !== "string" || !data.title.trim()) {
		throw new HttpError(400, "The frontmatter needs a non-empty `title`");
	}
}

/** Los errores de R2 se traducen a una respuesta sin filtrar detalles internos. */
export function adminFailure(error: unknown, route: string): Response {
	if (error instanceof HttpError) return json({ error: error.message }, error.status);

	Logger.error(error as Error, { route });
	return json({ error: "Request failed" }, 500);
}

// Puente entre las rutas de /api/admin y GitHub. Es el ÚNICO módulo que toca el
// PAT: el navegador nunca lo ve, todas las llamadas salen del servidor.
//
// Se lee y se escribe por la API de GitHub y no por `fs` porque en Vercel el
// filesystem es la foto del último build (queda obsoleto apenas se guarda algo)
// y además es de solo lectura. El `sha` que devuelve la lectura es lo que da
// bloqueo optimista: guardar sobre una versión que cambió da 409 en vez de pisar.
import "server-only";

import matter from "gray-matter";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { Logger } from "@/lib/logger";

const REPO = env.GITHUB_REPO || "wsalas19/portfolio-cf";
// La rama es configurable solo para probar contra una rama de tiro sin ensuciar
// master; en producción es master.
const BRANCH = env.GITHUB_BRANCH || "master";
const GITHUB_API = "https://api.github.com";

export class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export function json(body: unknown, status = 200): NextResponse {
	// Nada de esto puede quedar en caché: son datos por usuario.
	return NextResponse.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

/**
 * El `Origin` tiene que ser el del propio sitio. Se compara contra el host de la
 * petición y no contra `NEXT_PUBLIC_SITE_URL`, que es lo que había antes: esa
 * variable apuntaba al apex mientras el sitio canonicaliza en www, así que
 * *todo* guardado daba 403 en producción y funcionaba en local — el peor
 * reparto posible para un fallo, porque solo se ve desplegado. Además las
 * `NEXT_PUBLIC_*` se inlinean en el build: corregir la variable en Vercel no
 * arregla el deploy que ya está corriendo.
 *
 * Comparar contra el host de la petición es la defensa estándar contra CSRF y
 * cubre apex, www, deploys de preview y localhost con un solo chequeo, sin
 * ninguna variable que mantener sincronizada.
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
 * petición puede seguir.
 *
 * En los métodos que mutan se valida también el `Origin`: `SameSite=Lax` ya
 * bloquea el envío de la cookie desde otro sitio, esto es la segunda capa.
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

function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

async function gh(path: string, init: RequestInit = {}): Promise<Response> {
	if (!env.GITHUB_TOKEN) {
		throw new HttpError(500, "Server configuration error");
	}

	return fetch(`${GITHUB_API}${path}`, {
		...init,
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${env.GITHUB_TOKEN}`,
			// Sin User-Agent GitHub responde 403, que es el fallo que hace
			// parecer que el panel "no anda" sin decir por qué.
			"User-Agent": "wsalas-portfolio-admin",
			"X-GitHub-Api-Version": "2022-11-28",
			...(init.headers ?? {}),
		},
		cache: "no-store",
	});
}

async function ghJson(path: string, init?: RequestInit): Promise<unknown> {
	const response = await gh(path, init);
	if (response.ok) return response.json();

	// 404 y 409 se propagan con su código: son los dos casos que el editor sí
	// puede resolver ("no existe" y "alguien más guardó").
	if (response.status === 404 || response.status === 409) {
		throw new HttpError(response.status, response.status === 404 ? "Not found" : "Conflict");
	}

	Logger.error(new Error("GitHub API error"), { path, status: response.status });
	throw new HttpError(502, "GitHub error");
}

export async function ghList(dir: string): Promise<{ name: string; path: string }[]> {
	const data = await ghJson(`/repos/${REPO}/contents/${encodePath(dir)}?ref=${BRANCH}`);
	if (!Array.isArray(data)) throw new HttpError(502, "Unexpected GitHub response");

	return data
		.filter((entry): entry is { name: string; path: string } =>
			typeof entry?.name === "string" && typeof entry?.path === "string",
		)
		.map(({ name, path }) => ({ name, path }));
}

/**
 * Una carpeta que todavía no existe en el repo da lista vacía, no error. Solo se
 * traga el 404: un `catch` a secas sobre esto escondía también los fallos de
 * autenticación, y el panel mostraba una lista vacía como si no hubiera
 * contenido en vez de decir que el token estaba mal.
 */
export async function ghListOrEmpty(dir: string): Promise<{ name: string; path: string }[]> {
	try {
		return await ghList(dir);
	} catch (error) {
		if (error instanceof HttpError && error.status === 404) return [];
		throw error;
	}
}

export async function ghRead(path: string): Promise<{ sha: string; raw: string }> {
	const data = (await ghJson(`/repos/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`)) as {
		sha?: string;
		content?: string;
	};

	if (typeof data?.sha !== "string" || typeof data?.content !== "string") {
		throw new HttpError(502, "Unexpected GitHub response");
	}

	return { sha: data.sha, raw: Buffer.from(data.content, "base64").toString("utf8") };
}

async function ghPut(
	path: string,
	base64: string,
	message: string,
	sha?: string,
): Promise<{ sha: string }> {
	const data = (await ghJson(`/repos/${REPO}/contents/${encodePath(path)}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message, content: base64, branch: BRANCH, ...(sha ? { sha } : {}) }),
	})) as { content?: { sha?: string } };

	if (typeof data?.content?.sha !== "string") throw new HttpError(502, "Unexpected GitHub response");
	return { sha: data.content.sha };
}

export function ghSave(path: string, raw: string, sha: string | undefined): Promise<{ sha: string }> {
	return ghPut(path, Buffer.from(raw, "utf8").toString("base64"), `admin: update ${path}`, sha);
}

export function ghUpload(path: string, bytes: Buffer): Promise<{ sha: string }> {
	return ghPut(path, bytes.toString("base64"), `admin: upload ${path}`);
}

// El DELETE de la API de contenidos exige el `sha` de la versión que se borra:
// el handler lo lee justo antes. Es la misma garantía que el PUT — no se borra
// algo que cambió desde que se leyó.
export async function ghDelete(path: string, sha: string): Promise<void> {
	await ghJson(`/repos/${REPO}/contents/${encodePath(path)}`, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message: `admin: delete ${path}`, sha, branch: BRANCH }),
	});
}

/**
 * El historial no se inventa: git ya lo tiene. En vez de una tabla de revisiones
 * propia, el panel enlaza a los commits del archivo en GitHub.
 */
export function fileHistoryUrl(path: string): string {
	return `https://github.com/${REPO}/commits/${BRANCH}/${encodePath(path)}`;
}

/**
 * Imágenes de un post, leídas de su carpeta. Misma convención que
 * `galleryFor` de `src/lib/project-images.ts`.
 */
export async function imagesFor(slug: string): Promise<string[]> {
	const entries = await ghListOrEmpty(`public/images/blog/${slug}`);

	return entries
		.filter((entry) => /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((entry) => `/images/blog/${slug}/${entry.name}`);
}

/**
 * Un frontmatter que no parsea o sin `title` rompe el build del blog entero, no
 * solo esa página. Se valida con gray-matter (que ya es dependencia y ya usa
 * `posts.ts`) antes de commitear, para que el error se vea en el editor y no en
 * el deploy.
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

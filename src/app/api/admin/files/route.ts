import { z } from "zod";
import { isAllowedBlogSlug, isAllowedContentPath } from "@/lib/admin/auth";
import {
	adminFailure,
	assertValidDoc,
	contentCreate,
	contentDelete,
	contentImages,
	contentList,
	contentRead,
	contentSave,
	json,
	requireAdmin,
} from "@/lib/admin/server";

const DIRS = { blog: "content/blog", legal: "content/legal" } as const;
type Kind = keyof typeof DIRS;

/** ~1 MB de markdown es holgadísimo: el post más largo del repo tiene 30 KB. */
const MAX_RAW = 1_000_000;

const saveSchema = z.object({
	path: z.string(),
	sha: z.string().min(1),
	raw: z.string().min(1).max(MAX_RAW),
});

const createSchema = z.object({
	kind: z.enum(["blog", "legal"]),
	slug: z.string(),
	raw: z.string().min(1).max(MAX_RAW),
});

function slugOf(path: string): string {
	return path.split("/").pop()?.replace(/\.md$/, "") ?? "";
}

export async function GET(request: Request) {
	const denied = requireAdmin(request, "GET");
	if (denied) return denied;

	const path = new URL(request.url).searchParams.get("path");

	try {
		if (path !== null) {
			if (!isAllowedContentPath(path)) return json({ error: "Invalid path" }, 400);

			// Todo lo que el editor necesita para abrir un documento en una sola
			// vuelta: el texto, el ETag para el bloqueo optimista y qué imágenes ya
			// tiene la carpeta del post.
			const slug = slugOf(path);
			const { sha, raw } = await contentRead(path);
			return json({
				path,
				sha,
				raw,
				images: path.startsWith("content/blog/") ? await contentImages(slug) : [],
			});
		}

		const lists = await Promise.all(
			(Object.entries(DIRS) as [Kind, string][]).map(async ([kind, dir]) => {
				const entries = await contentList(dir);
				return entries.map((entry) => ({ kind, path: entry.path }));
			}),
		);

		return json({ files: lists.flat() });
	} catch (error) {
		return adminFailure(error, "/api/admin/files");
	}
}

export async function PUT(request: Request) {
	const denied = requireAdmin(request, "PUT");
	if (denied) return denied;

	try {
		const parsed = saveSchema.safeParse(await request.json());
		if (!parsed.success) return json({ error: "Invalid input data" }, 400);

		const { path, sha, raw } = parsed.data;
		if (!isAllowedContentPath(path)) return json({ error: "Invalid path" }, 400);
		assertValidDoc(raw);

		// El ETag viejo hace que R2 rechace el PUT si el objeto cambió desde la
		// lectura: se avisa en vez de pisar el cambio ajeno.
		const saved = await contentSave(path, raw, sha);
		return json({ ok: true, sha: saved.sha });
	} catch (error) {
		return adminFailure(error, "/api/admin/files");
	}
}

export async function DELETE(request: Request) {
	const denied = requireAdmin(request, "DELETE");
	if (denied) return denied;

	try {
		const path = new URL(request.url).searchParams.get("path") ?? "";
		if (!isAllowedContentPath(path)) return json({ error: "Invalid path" }, 400);

		await contentDelete(path);
		return json({ ok: true });
	} catch (error) {
		return adminFailure(error, "/api/admin/files");
	}
}

export async function POST(request: Request) {
	const denied = requireAdmin(request, "POST");
	if (denied) return denied;

	try {
		const parsed = createSchema.safeParse(await request.json());
		if (!parsed.success) return json({ error: "Invalid input data" }, 400);

		const { kind, slug, raw } = parsed.data;
		if (!isAllowedBlogSlug(slug)) return json({ error: "Invalid slug" }, 400);
		assertValidDoc(raw);

		const path = `${DIRS[kind]}/${slug}.md`;
		if (!isAllowedContentPath(path)) return json({ error: "Invalid slug" }, 400);

		const created = await contentCreate(path, raw);
		return json({ path, sha: created.sha }, 201);
	} catch (error) {
		return adminFailure(error, "/api/admin/files");
	}
}

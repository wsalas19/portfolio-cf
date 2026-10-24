import { env } from "cloudflare:workers";
import { contentBucket } from "@/lib/content/r2";

// Sirve las imágenes de blog que viven en R2. Si el objeto no está (por ejemplo,
// una imagen vieja que sigue en public/), delega en los static assets para no
// romper los posts existentes.
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const key = `images/blog/${path.join("/")}`;
	const bucket = contentBucket();

	if (bucket) {
		const object = await bucket.get(key);
		if (object) {
			return new Response(object.body, {
				headers: {
					"Content-Type":
						object.httpMetadata?.contentType ?? "application/octet-stream",
					"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
				},
			});
		}
	}

	const assets = (env as { ASSETS: { fetch(request: Request): Promise<Response> } })
		.ASSETS;
	return assets.fetch(request);
}

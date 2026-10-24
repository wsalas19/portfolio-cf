import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog/posts";
import { env } from "@/lib/env";

// Next sirve /sitemap.xml desde acá. Antes era un `public/sitemap.xml` escrito a
// mano, y por eso se quedó listando 1 de los 6 posts y ninguno de los routes de
// herramientas: un archivo estático no se entera de contenido nuevo. Leyendo los
// posts reales no puede volver a quedar desincronizado.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = env.NEXT_PUBLIC_SITE_URL;
	const posts = await getAllPosts();

	const staticRoutes: {
		path: string;
		priority: number;
		changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
	}[] = [
		{ path: "", priority: 1, changeFrequency: "weekly" },
		// La landing traducida. No lleva entry aparte con `alternates`: el `hreflang`
		// ya lo emite la metadata de cada página y repetirlo acá no lo refuerza.
		{ path: "/es", priority: 0.9, changeFrequency: "weekly" },
		{ path: "/blog", priority: 0.9, changeFrequency: "weekly" },
		{ path: "/visor-credito", priority: 0.9, changeFrequency: "monthly" },
		{ path: "/tools", priority: 0.8, changeFrequency: "monthly" },
		{ path: "/twitter-threads", priority: 0.7, changeFrequency: "monthly" },
		{ path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
		{ path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
	];

	return [
		// Sin `lastModified`: la fecha real de cada página no se conoce acá y
		// poner `new Date()` haría que todo figure como recién cambiado en cada
		// deploy, que es ruido para el crawler.
		...staticRoutes.map(({ path, priority, changeFrequency }) => ({
			url: `${base}${path}`,
			priority,
			changeFrequency,
		})),
		...posts.map((post) => ({
			url: `${base}/blog/${post.slug}`,
			lastModified: new Date(post.date),
			changeFrequency: "monthly" as const,
			priority: 0.8,
		})),
	];
}

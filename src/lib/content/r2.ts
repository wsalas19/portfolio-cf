// Acceso a los bindings de R2 y KV desde el runtime del Worker. Los tipos
// vienen de `worker-configuration.d.ts`, generado por `wrangler types`.
import { env } from "cloudflare:workers";

export function contentBucket(): R2Bucket | undefined {
	return (env as Partial<Env>).CONTENT;
}

export function cacheKv(): KVNamespace | undefined {
	return (env as Partial<Env>).VINEXT_KV_CACHE;
}

/** R2 devuelve los ETag entre comillas; el admin usa el valor sin comillas. */
export function cleanEtag(value: string | undefined): string {
	return (value ?? "").replace(/^"|"$/g, "");
}

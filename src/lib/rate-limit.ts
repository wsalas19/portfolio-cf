import "server-only";

import { cacheKv } from "@/lib/content/r2";

type Entry = { count: number; resetTime: number };

// Fallback en memoria para tests y para un entorno sin KV. En producción el
// contador vive en KV, que sí se comparte entre isolates.
const memory = new Map<string, Entry>();

function readMemory(key: string): Entry | undefined {
	return memory.get(key);
}

function writeMemory(key: string, entry: Entry): void {
	memory.set(key, entry);
}

/**
 * Ventana fija por clave. Devuelve `allowed: false` y el instante de reset
 * cuando se pasa el límite.
 *
 * `expirationTtl` de KV tiene un mínimo de 60s; la ventana real se guarda en el
 * valor. Cada request escribe una vez, así que el plan gratis (1k writes/día)
 * alcanza para un formulario de contacto y un login de un solo editor.
 */
export async function checkRateLimit(
	key: string,
	max: number,
	windowSeconds: number,
): Promise<{ allowed: boolean; resetAt?: number }> {
	const now = Date.now();
	const kv: KVNamespace | undefined = cacheKv();

	if (!kv) return checkMemory(key, max, windowSeconds, now);

	let entry: Entry | undefined;
	try {
		const raw = await kv.get(key);
		if (raw) entry = JSON.parse(raw) as Entry;
	} catch {
		entry = undefined;
	}

	if (!entry || now > entry.resetTime) {
		const resetTime = now + windowSeconds * 1000;
		await kv.put(key, JSON.stringify({ count: 1, resetTime }), {
			expirationTtl: Math.max(60, windowSeconds),
		});
		return { allowed: true };
	}

	if (entry.count >= max) {
		return { allowed: false, resetAt: entry.resetTime };
	}

	entry.count += 1;
	await kv.put(key, JSON.stringify(entry), {
		expirationTtl: Math.max(60, Math.ceil((entry.resetTime - now) / 1000)),
	});
	return { allowed: true };
}

function checkMemory(
	key: string,
	max: number,
	windowSeconds: number,
	now: number,
): { allowed: boolean; resetAt?: number } {
	const entry = readMemory(key);

	if (!entry || now > entry.resetTime) {
		writeMemory(key, { count: 1, resetTime: now + windowSeconds * 1000 });
		return { allowed: true };
	}

	if (entry.count >= max) return { allowed: false, resetAt: entry.resetTime };

	entry.count += 1;
	writeMemory(key, entry);
	return { allowed: true };
}

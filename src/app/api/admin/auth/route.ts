import { z } from "zod";
import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	checkPassword,
	signSession,
	verifySession,
} from "@/lib/admin/auth";
import { cookieValue, isAllowedOrigin, json } from "@/lib/admin/server";
import { env } from "@/lib/env";
import { Logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export async function GET(request: Request) {
	const session = cookieValue(request, SESSION_COOKIE);
	return json({ authenticated: verifySession(session, env.ADMIN_SECRET) });
}

export async function POST(request: Request) {
	const ip =
		request.headers.get("cf-connecting-ip") ||
		request.headers.get("x-forwarded-for")?.split(",")[0] ||
		"unknown";

	const { allowed } = await checkRateLimit(`rl:admin:${ip}`, 5, 15 * 60);
	if (!allowed) {
		Logger.security("ADMIN_LOGIN_RATE_LIMITED", { ip });
		return json({ error: "Too many attempts" }, 429);
	}

	// Sin env no hay login posible. Se contesta genérico: distinguir "falta
	// configurar" de "contraseña incorrecta" le contaría a un tercero que el
	// panel está a medio configurar.
	if (!env.ADMIN_PASSWORD || !env.ADMIN_SECRET) {
		Logger.error(new Error("Missing admin environment variables"), { ip });
		return json({ error: "Server configuration error" }, 500);
	}

	let password: string;
	try {
		const parsed = loginSchema.safeParse(await request.json());
		if (!parsed.success) return json({ error: "Invalid input data" }, 400);
		password = parsed.data.password;
	} catch {
		return json({ error: "Invalid input data" }, 400);
	}

	if (!checkPassword(password, env.ADMIN_PASSWORD)) {
		Logger.security("ADMIN_LOGIN_FAILED", { ip });
		return json({ error: "Unauthorized" }, 401);
	}

	const token = signSession(env.ADMIN_SECRET);
	if (!token) return json({ error: "Server configuration error" }, 500);

	Logger.security("ADMIN_LOGIN_OK", { ip });

	const response = json({ ok: true });
	response.cookies.set({
		name: SESSION_COOKIE,
		value: token,
		httpOnly: true,
		sameSite: "lax",
		// En desarrollo el sitio va por http: `secure` ahí descartaría la cookie.
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: SESSION_MAX_AGE,
	});
	return response;
}

export async function DELETE(request: Request) {
	if (!isAllowedOrigin(request)) {
		return json({ error: "Forbidden" }, 403);
	}

	const response = json({ ok: true });
	response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
	return response;
}

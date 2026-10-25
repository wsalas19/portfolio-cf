import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest): NextResponse {
	const host = request.headers.get("host") ?? "";

	// `www` es el host canónico. El apex se queda con un 308 para no duplicar
	// señales de SEO ni partir cookies entre dos hosts.
	if (host === "wsalas.com") {
		const url = new URL(request.url);
		url.protocol = "https:";
		url.host = "www.wsalas.com";
		return NextResponse.redirect(url, 308);
	}

	const response = NextResponse.next();

	// País del visitante para elegir la moneda del precio. Cloudflare pone
	// `CF-IPCountry` en el edge; Vercel usaba `x-vercel-ip-country`. Se dejan
	// ambos para que el mismo código funcione en local y en el deploy.
	//
	// Se escribe solo si la cookie falta, a propósito: mandar `Set-Cookie` en
	// cada respuesta le quita al HTML estático la posibilidad de servirse desde
	// caché compartida. A partir de la segunda visita no se toca nada.
	if (!request.cookies.has("geo")) {
		const country =
			request.headers.get("cf-ipcountry") ??
			request.headers.get("x-vercel-ip-country");
		if (country) {
			response.cookies.set("geo", country.toUpperCase(), {
				path: "/",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30,
			});
		}
	}

	// Content Security Policy - relaxed for WebGL and development
	response.headers.set(
		"Content-Security-Policy",
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://static.cloudflareinsights.com https://challenges.cloudflare.com blob:",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https: blob:",
			"font-src 'self' data:",
			"connect-src 'self' https://wsalas.com https://www.google-analytics.com https://cloudflareinsights.com https://challenges.cloudflare.com",
			"frame-src https://challenges.cloudflare.com",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			"upgrade-insecure-requests",
			"worker-src 'self' blob:",
		].join("; "),
	);

	// Security headers
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=()",
	);
	response.headers.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains",
	);
	response.headers.set("X-XSS-Protection", "1; mode=block");

	// Remove server information
	response.headers.delete("Server");
	response.headers.delete("X-Powered-By");

	// El deploy de staging vive en *.workers.dev. No debe competir con el sitio
	// real en buscadores; el dominio definitivo no lleva este header.
	if (host.endsWith(".workers.dev")) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

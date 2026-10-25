"use client";

import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/constants";

type TurnstileApi = {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			theme?: "light" | "dark" | "auto";
			appearance?: "always" | "execute" | "interaction-only";
			size?: "normal" | "compact" | "flexible";
			action?: string;
			callback?: (token: string) => void;
			"expired-callback"?: () => void;
			"error-callback"?: () => void;
		},
	) => string;
	reset: (widgetId?: string) => void;
	remove: (widgetId?: string) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

const SCRIPT_SRC =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// En desarrollo se usa la clave de prueba oficial de Turnstile, que siempre
// pasa. En producción se usa el widget real del sitio.
const SITE_KEY =
	process.env.NODE_ENV === "production"
		? TURNSTILE_SITE_KEY
		: "1x00000000000000000000AA";

export function Turnstile({
	onToken,
}: {
	onToken: (token: string | null) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<string | null>(null);
	const callbackRef = useRef(onToken);
	callbackRef.current = onToken;

	useEffect(() => {
		let cancelled = false;
		let timer: number | undefined;

		const render = () => {
			if (
				cancelled ||
				!containerRef.current ||
				!window.turnstile ||
				widgetRef.current
			) {
				return;
			}

			widgetRef.current = window.turnstile.render(containerRef.current, {
				sitekey: SITE_KEY,
				theme: "dark",
				appearance: "always",
				size: "flexible",
				action: "contact",
				callback: (token) => callbackRef.current(token),
				"expired-callback": () => callbackRef.current(null),
				"error-callback": () => callbackRef.current(null),
			});
		};

		let script = document.querySelector<HTMLScriptElement>(
			`script[src^="${SCRIPT_SRC}"]`,
		);

		if (window.turnstile) {
			render();
		} else {
			if (!script) {
				script = document.createElement("script");
				script.src = SCRIPT_SRC;
				script.async = true;
				script.defer = true;
				document.head.appendChild(script);
			}
			script.addEventListener("load", render, { once: true });
			// Si el script ya estaba cargando, el evento puede haber pasado antes
			// de enganchar el listener. El timer es el respaldo.
			timer = window.setTimeout(render, 1000);
		}

		return () => {
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			script?.removeEventListener("load", render);
			if (widgetRef.current) {
				window.turnstile?.remove(widgetRef.current);
				widgetRef.current = null;
			}
		};
	}, []);

	return <div ref={containerRef} className="min-h-[65px]" />;
}

import { paths as pathSeeds } from "@/lib/constants";
import type { PathType } from "@/lib/types/globals";
import type { LandingCopy, Locale } from "./types";

/**
 * El copy que necesita el chrome —nav, footer, botones flotantes— y nada más.
 *
 * Vive aparte de `en.ts`/`es.ts` por una razón de peso, no de orden: `NavBar`,
 * `Footer`, `ScrollButton` y `DownloadResume` son componentes de cliente, así que
 * todo lo que importen viaja al navegador en *todas* las páginas. Importar
 * `@/lib/i18n` desde ahí metía la prosa entera de la landing —los dos idiomas,
 * ~20 KB— en el bundle de `/blog` y de `/tools`, que no la usan para nada.
 *
 * De acá salen los valores que `en.ts`/`es.ts` reutilizan, así que sigue habiendo
 * una sola copia de cada cadena.
 */
type CoreCopy = Pick<LandingCopy, "nav" | "footer" | "chrome">;

const CORE: Record<Locale, CoreCopy> = {
	en: {
		nav: {
			about: "about",
			services: "services",
			experience: "experience",
			projects: "projects",
			contact: "contact",
			blog: "blog",
			tools: "tools",
		},
		footer: {
			about:
				"Full-stack product development and technical review for production web applications.",
			onThisPage: "On this page",
			more: "More",
			elsewhere: "Elsewhere",
			rights: "All rights reserved.",
			builtWith: "Built with Next.js and Tailwind CSS.",
			deployedOn: "Deployed on Cloudflare",
		},
		chrome: {
			menuOpen: "Open menu",
			menuClose: "Close menu",
			bookMeeting: "Book a Meeting",
			backToTop: "Back to Top",
			downloadCv: "Download CV",
			downloading: "Downloading",
			downloadIconLabel: "download icon",
		},
	},
	es: {
		nav: {
			about: "sobre mí",
			services: "servicios",
			experience: "experiencia",
			projects: "proyectos",
			contact: "contacto",
			blog: "blog",
			tools: "herramientas",
		},
		footer: {
			about:
				"Desarrollo de producto full-stack y revisión técnica para aplicaciones web en producción.",
			onThisPage: "En esta página",
			more: "Más",
			elsewhere: "En otros sitios",
			rights: "Todos los derechos reservados.",
			builtWith: "Construido con Next.js y Tailwind CSS.",
			deployedOn: "Desplegado en Cloudflare",
		},
		chrome: {
			menuOpen: "Abrir menú",
			menuClose: "Cerrar menú",
			bookMeeting: "Agenda una reunión",
			backToTop: "Volver arriba",
			downloadCv: "Descargar CV",
			downloading: "Descargando",
			downloadIconLabel: "ícono de descarga",
		},
	},
};

export const CORE_COPY = CORE;

// Cae a inglés si llega un idioma desconocido, para que una URL rara nunca deje
// el chrome sin texto.
export function getChromeCopy(locale: Locale): CoreCopy {
	return CORE[locale] ?? CORE.en;
}

/**
 * El layout raíz no recibe el parámetro `[locale]` (vive por encima del segmento),
 * así que los componentes de chrome derivan el idioma de la ruta. `/es` y
 * `/es/loquesea` son español; el resto, inglés.
 */
export function localeFromPathname(pathname: string): Locale {
	return pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";
}

/**
 * Etiquetas de `paths` para la nav y el footer. Traduce solo el `name`; el `path`
 * es un ancla o una ruta y no cambia con el idioma.
 */
export function getNavPaths(locale: Locale): PathType[] {
	const { nav } = getChromeCopy(locale);
	return pathSeeds.map((path) => ({ ...path, name: nav[path.name] ?? path.name }));
}

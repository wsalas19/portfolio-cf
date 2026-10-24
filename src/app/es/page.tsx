import Home from "@/components/pages/home";
import SetDocLang from "@/components/SetDocLang";
import { Metadata } from "next";

// El título y la descripción viven acá y no en `i18n/es.ts` porque el inglés hace
// exactamente lo mismo en `app/page.tsx`: la metadata es de la ruta, la prosa de
// la página es de `i18n`. Mantener los dos idiomas en el mismo sitio es lo que
// hace que se puedan comparar.
const TITLE =
	"William Salas — Desarrollador Full-Stack para contratar | Next.js, React, TypeScript";
const DESCRIPTION =
	"Desarrollador full-stack freelance en Barranquilla, Colombia. Construyo software web en producción con Next.js, React y TypeScript, y reviso la arquitectura antes de que cambiarla salga caro. Agenda una llamada.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	keywords: [
		"contratar desarrollador full stack",
		"desarrollador React freelance",
		"desarrollador Next.js freelance",
		"desarrollador TypeScript",
		"consultor Next.js",
		"revisión de código técnica",
		"consultor de software Colombia",
		"desarrollo de aplicaciones web",
		"desarrollo de APIs",
		"desarrollo full stack",
		"William Salas",
		"wsalas",
	],
	authors: [{ name: "William Salas", url: "https://www.wsalas.com" }],
	creator: "William Salas",
	publisher: "William Salas",
	alternates: {
		canonical: "/es",
		languages: {
			en: "/",
			es: "/es",
			"x-default": "/",
		},
	},

	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		url: "https://www.wsalas.com/es",
		siteName: "William Salas Portfolio",
		locale: "es_CO",
		alternateLocale: ["en_US"],
		type: "website",
	},

	twitter: {
		card: "summary_large_image",
		title: TITLE,
		description: DESCRIPTION,
		creator: "@wsalas19",
		site: "@wsalas19",
	},

	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export const dynamic = "force-dynamic";

export default function Page() {
	return (
		<>
			<SetDocLang locale="es" />
			<Home locale="es" />
		</>
	);
}

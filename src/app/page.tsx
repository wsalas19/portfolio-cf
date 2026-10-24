import Home from "@/components/pages/home";
import { Metadata } from "next";

const TITLE = "William Salas — Full-Stack Developer for Hire | Next.js, React, TypeScript";
const DESCRIPTION =
	"Freelance full-stack developer in Barranquilla, Colombia. I build production web software in Next.js, React and TypeScript — and review the architecture before it gets expensive to change. Book a call.";

// El título y la descripción nombran la oferta, no solo a la persona: quien
// busca "hire react developer" tiene que reconocer en el resultado lo que se
// puede contratar. El nombre sigue presente en el título y en las keywords.
export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	keywords: [
		"hire full stack developer",
		"freelance React developer",
		"freelance Next.js developer",
		"TypeScript developer",
		"Next.js consultant",
		"technical code review",
		"software consultant Colombia",
		"web application development",
		"API development",
		"full stack development",
		"William Salas",
		"wsalas",
	],
	authors: [{ name: "William Salas", url: "https://www.wsalas.com" }],
	creator: "William Salas",
	publisher: "William Salas",
	// El inglés vive en `/` y el español en `/es`: nada de `/en`. Mover la URL que
	// ya posiciona para ganar simetría sería pagar el ranking con la moneda del
	// ranking. `x-default` apunta a `/` porque ese es el idioma de partida.
	alternates: {
		canonical: "/",
		languages: {
			en: "/",
			es: "/es",
			"x-default": "/",
		},
	},

	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		url: "https://www.wsalas.com",
		siteName: "William Salas Portfolio",
		locale: "en_US",
		alternateLocale: ["es_CO"],
		type: "website",
		// Sin `images`: la tarjeta la genera `src/app/opengraph-image.tsx`. Antes
		// apuntaba a `/og-image.png`, que no existe en `public/`, así que toda
		// tarjeta compartida salía sin imagen.
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

	verification: {
		// Add your verification codes here when you get them from:
		// google: "your-google-verification-code",
		// yandex: "your-yandex-verification-code",
	},
};

export const dynamic = "force-dynamic";

export default async function page() {
	return <Home locale="en" />;
}

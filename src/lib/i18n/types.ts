import type { ServiceTrackId } from "@/lib/types/globals";

// Los idiomas que el sitio sabe renderizar. La landing es la única superficie
// traducida por ahora; el resto del sitio sigue en inglés.
export type Locale = "en" | "es";

/**
 * Toda la prosa visible de la landing, indexada por identificadores estables.
 *
 * Las claves de los `Record` no son índices de array a propósito: `jobs` se indexa
 * por `company`, `projects` por `slug`, `serviceTracks` por `id` y `faq` por `id`.
 * Así, reordenar un array en `constants.ts` no puede intercambiar dos traducciones
 * en silencio, que es el fallo clásico de un i18n indexado por posición.
 */
export interface LandingCopy {
	nav: Record<string, string>;
	profile: { eyebrow: string; tagline: string; bio: string };
	jobs: Record<string, { role: string; description: string }>;
	projects: Record<
		string,
		{ title: string; description: string; highlights: string[] }
	>;
	// Indexado por la unión cerrada y no por `string`: así falta una entrada en
	// `es.ts` y el build falla, en vez de mostrar inglés sin avisar.
	serviceTracks: Record<
		ServiceTrackId,
		{ eyebrow: string; title: string; description: string; items: string[] }
	>;
	faq: Record<string, { question: string; answer: string }>;
	stats: {
		years: string;
		projects: string;
		articles: string;
		blocks: string;
		blocksValue: string;
	};
	hero: {
		// La oferta va en el H1 y el nombre firma debajo: antes el único tipo
		// grande de la página decía quién es y no qué se compra.
		headline: string;
		// `{years}` y `{projects}` los rellena `fillTemplate` con datos derivados
		// (`experienceStart` y el largo de `projects`), no con números escritos.
		proofYears: string;
		proofProjects: string;
		featuredWork: string;
		bookACall: string;
		emailMe: string;
		seeTheWork: string;
		altText: string;
	};
	servicesSection: {
		eyebrow: string;
		title: string;
		description: string;
		cta: string;
		// Prefijo y sufijos del precio: "from $2,500" / "$2,400 /mo".
		priceFrom: string;
		priceOnce: string;
		pricePerMonth: string;
		askWhatsApp: string;
		bookCall: string;
		// `{service}` y `{price}` los rellena `fillTemplate`.
		whatsappMessage: string;
	};
	workSection: {
		eyebrow: string;
		title: string;
		description: string;
		highlights: string;
		gallery: string;
		viewLive: string;
		viewCode: string;
		close: string;
		screenshotSuffix: string;
	};
	// Experience.tsx renderiza un SectionHeading desde que la nav enlaza a
	// `#experience`; antes la sección era una línea de tiempo sin título. El año
	// de origen no se escribe: viene de `PROFILE.experienceStart`.
	experienceSection: {
		eyebrow: string;
		title: string;
		startLabel: string;
		showMore: string;
		showLess: string;
	};
	journalSection: {
		eyebrow: string;
		title: string;
		description: string;
		allArticles: string;
	};
	// Testimonials y Faq renderizan eyebrow + título y nada más (sin descripción).
	testimonialsSection: { eyebrow: string; title: string; visitSite: string };
	faqSection: { eyebrow: string; title: string };
	ctaBand: {
		eyebrow: string;
		title: string;
		body: string;
		primary: string;
		secondary: string;
	};
	contact: Record<string, string>;
	footer: Record<string, string>;
	blogCard: { readMore: string; moreSuffix: string; minutesSuffix: string };
	chrome: {
		menuOpen: string;
		menuClose: string;
		bookMeeting: string;
		backToTop: string;
		downloadCv: string;
		downloading: string;
		downloadIconLabel: string;
	};
	dates: { present: string };
}

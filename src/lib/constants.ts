import {
	FaqSeed,
	JobSeed,
	PathType,
	ProjectSeed,
	ServiceTrackSeed,
	Testimonial,
} from "./types/globals";

// Datos neutrales (sin prosa). La prosa vive en `@/lib/i18n` indexada por idioma;
// el merge de ese módulo hidrata estas semillas para producir los tipos completos
// (`jobProps`, `Project`, etc.). Acá solo queda lo que no se traduce: rutas,
// fechas, tecnologías, imágenes y enlaces.
export const paths: PathType[] = [
	{ name: "about", path: "#about" },
	{ name: "services", path: "#services" },
	{ name: "experience", path: "#experience" },
	{ name: "projects", path: "#projects" },
	{ name: "contact", path: "#contact" },
	{ name: "blog", path: "/blog", isRoute: true },
	{ name: "tools", path: "/tools", isRoute: true },
];

export const imgSize: number = 300;

// Una sola fuente para los datos que aparecen en más de un sitio. El LinkedIn
// estaba escrito dos veces con handles distintos: `layout.tsx` (JSON-LD del
// Person) apuntaba a /in/william-salas-19 y el botón de la home a
// /in/williamsalasb/.
export const SOCIAL_LINKS = {
	github: "https://github.com/wsalas19",
	linkedin: "https://www.linkedin.com/in/williamsalasb/",
	upwork: "https://www.upwork.com/freelancers/williams59",
} as const;

export const CONTACT_EMAIL = "wa.salas1905@hotmail.com";

// Estaba escrita a mano en `NavBar.tsx`. Ahora la usan la nav, el hero, la banda
// de CTA y el footer: cuatro copias del mismo link era una errata esperando.
export const CALENDAR_URL = "https://calendar.app.google/DY4tPQXi5Dn1gKZz9";

// Número de los botones de precio, en formato internacional sin "+" (lo que
// pide wa.me). Es el mismo que ya está publicado en `content/legal/privacidad.md`
// como teléfono de contacto, así que no es un dato nuevo en el sitio.
//
// Vive acá y no en una variable de entorno a propósito: `/` es estática, así que
// un `WHATSAPP_NUMBER` en Vercel igual se hornea en el HTML en cada build. Una
// variable no compraba nada y agregaba un modo de fallo (sin número configurado
// los botones caían al calendario sin avisar).
export const WHATSAPP_NUMBER = "573229367867";

/**
 * Lo neutral del perfil. La bio, el eyebrow y el tagline son prosa y viven en
 * `i18n`. El nombre, el wordmark, las skills, la ubicación y el país no se
 * traducen y los necesitan el hero, las stats, el footer y el JSON-LD.
 *
 * El texto que sí se traduce pasó por una revisión de inglés técnico simplificado
 * (ASD-STE100); ver `i18n/en.ts`.
 */
export const PROFILE = {
	name: "William Salas Bolaño",
	wordmark: "WSALAS",
	location: "Barranquilla, Colombia",
	country: "CO",
	skills: [
		"React",
		"TypeScript",
		"Node.js",
		"Next.js",
		"Tailwind CSS",
		"GraphQL",
	],
	// El año en que arranca la línea de tiempo de `jobs`, para derivar los años
	// de experiencia en vez de escribir el número.
	experienceStart: 2022,
} as const;

// Las descripciones (prosa) viven en `i18n`, indexadas por `company`.
export const jobs: JobSeed[] = [
	{
		company: "Everus",
		companyUrl: "https://everuscares.com",
		startDate: "Oct 2025",
		endDate: "Present",
		technologies: [
			"Next.js",
			"Typescript",
			"Vercel",
			"Supabase",
			"Tailwind CSS",
			"AI integration",
		],
	},
	{
		company: "PatientStudio",
		companyUrl: "https://www.patientstudio.com/",
		startDate: "May 2025",
		endDate: "Apr 2026",
		technologies: [
			"React",
			"Typescript",
			"Tailwind",
			"Vite",
			"Storybook",
			"Jira",
			"GraphQL",
		],
	},
	{
		company: "Gwocu Studio",
		startDate: "Nov 2024",
		endDate: "Mar 2025",
		technologies: ["Jira", "React", "REST API", "AI"],
	},
	{
		company: "App Academy",
		companyUrl: "https://www.appacademy.io/",
		startDate: "Dec 2023",
		endDate: "Jan 2025",
	},
	{
		company: "PNG Technology Solutions",
		companyUrl: "https://www.linkedin.com/company/png-technology-solutions/",
		startDate: "Jul 2023",
		endDate: "Nov 2023",
		technologies: [
			"React",
			"Next.js",
			"Material UI",
			"Postgres",
			"Angular",
			"AWS",
			"Github Actions",
			"Docker",
		],
	},
	{
		company: "Henry",
		companyUrl: "https://www.soyhenry.com/",
		startDate: "Sep 2022",
		endDate: "Feb 2023",
	},
];
// El orden es el que ve el visitante: primero el trabajo propio y público (que se
// puede abrir y verificar), después el trabajo de cliente y, al final, la
// contribución a un proyecto de otro.
// Se quitaron Hunt Club Portal y Office Supplies Manager: los dos son software
// privado sin nada público que enlazar (Hunt Club solo lo abren socios; del otro
// no hay más material), y una tarjeta sin botón es un callejón sin salida que
// resta credibilidad en vez de sumarla.
//
// Título, descripción y highlights (prosa) viven en `i18n`, indexados por `slug`.
export const projects: ProjectSeed[] = [
	{
		slug: "frieda-player",
		technologies: ["Rust", "Tauri 2", "React", "TypeScript", "Windows SMTC"],
		liveUrl: "https://frieda-player.wsalas.workers.dev/",
		githubUrl: "https://github.com/wsalas19/frieda-player",
		imageUrl: "/images/frieda-player.png",
	},
	{
		slug: "visor-credito",
		technologies: ["Next.js", "TypeScript", "Chart.js", "Tailwind CSS"],
		liveUrl: "/visor-credito",
		imageUrl: "/images/visor-credito.png",
	},
	{
		slug: "twitter-threads",
		technologies: ["Next.js", "TypeScript", "X API", "Tailwind CSS"],
		liveUrl: "/twitter-threads",
		imageUrl: "/images/twitter-threads.png",
	},
	{
		slug: "barranquilla-verde",
		technologies: [
			"Google Earth Engine",
			"Sentinel-2",
			"OSMnx",
			"Python",
			"ArcGIS",
		],
		liveUrl: "/blog/barranquilla-verde-desigualdad-2026",
		imageUrl:
			"/images/blog/barranquilla-verde-desigualdad-2026/01_estrato_y_ndvi.webp",
	},
	{
		slug: "doctor-portal",
		technologies: [
			"React",
			"Vite",
			"TypeScript",
			"Tailwind CSS",
			"Storybook",
			"Figma",
			"GraphQL",
		],
		// El portal en sí es privado (solo entra personal médico), así que el enlace
		// va al sitio del producto para el que se construyó.
		liveUrl: "https://www.patientstudio.com/",
		imageUrl: "/images/projects/doctor-portal/01-portal.png",
	},
	{
		slug: "invoify",
		technologies: ["Next.js", "TypeScript", "React-PDF", "Shadcn"],
		// El enlace va al PR mergeado y no al repo: la tarjeta trata sobre el aporte,
		// y desde el PR el repo queda a un clic. El PR es la única prueba pública de
		// que el código entró.
		githubUrl: "https://github.com/al1abb/invoify/pull/664",
		imageUrl: "/images/invoify.png",
	},
];

export const gradientColors = ["#d4ff4d", "#a2a206", "#2e3320", "#fb8983"];

// Los tres caminos que se pueden contratar. Cada afirmación sale de `jobs`: no
// hay ningún servicio acá que no tenga un trabajo detrás que lo respalde.
// Toda la prosa (eyebrow, title, description, items) vive en `i18n`, por `id`.
//
// El precio en pesos NO es la conversión del de dólares: es un precio distinto,
// ajustado al mercado local. Por eso están escritos a mano y no calculados. El
// retainer es el único con `cta: "calendar"`: se acota en una llamada.
export const serviceTracks: ServiceTrackSeed[] = [
	{ id: "landing", price: { usd: 500, cop: 1_500_000 } },
	{ id: "build", price: { usd: 2_500, cop: 7_500_000 }, priceFrom: true },
	{
		id: "partner",
		price: { usd: 2_400, cop: 6_500_000 },
		priceFrom: true,
		pricePeriod: "month",
		cta: "calendar",
	},
];

// Respuestas apoyadas en datos del CV, no en promesas. Si una respuesta no se
// puede respaldar con un trabajo, una fecha o un repo, no va acá.
// El `id` es la clave estable de traducción; la pregunta y la respuesta viven en
// `i18n`.
export const faq: FaqSeed[] = [
	{ id: "work" },
	{ id: "stack" },
	{ id: "team" },
	{ id: "ai" },
	{ id: "timezones" },
	{ id: "start" },
];

// Dos citas cargadas como borrador: Derek Sanborn pidió que se la redacte y Sam
// Gaddis pidió revisarla antes de publicar. Las citas quedan en su idioma
// original —una cita traducida deja de ser una cita—; lo que se traduce es el
// marco de la sección, en `i18n`. Los retratos van en
// `public/images/testimonials/` cuando llegue la foto autorizada.
export const testimonials: Testimonial[] = [
	{
		quote:
			"William became the engineer we trusted with our most sensitive screens. He built features for the doctor portal in React and TypeScript and kept our component library consistent in Storybook. He works well with designers and backend engineers, and he raises problems before they get expensive.",
		name: "Derek Sanborn",
		role: "CEO",
		company: "PatientStudio",
		portraitUrl: "/images/testimonials/derek-sanborn.jpg",
		url: "https://patientstudio.com",
	},
	{
		quote:
			"William kept the Cottonwood work moving. He was honest about scope, shipped in small increments we could actually see, and left the code easier to work in than he found it. Communication stayed clear from kickoff to handoff.",
		name: "Sam Gaddis",
		role: "Co-founder",
		company: "Runpoint Partners",
		portraitUrl: "/images/testimonials/sam-gaddis.png",
		url: "https://samgaddis.com",
	},
];

// Claves públicas de integración. No son secretos: viajan al navegador.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFldAxTffAygHftq";
export const CF_WEB_ANALYTICS_TOKEN = "3e4d8f86188f4e8db81c2bf34ff6957e";

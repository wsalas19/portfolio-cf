import { CORE_COPY } from "./core";
import type { LandingCopy } from "./types";

/**
 * La copia inglesa, movida verbatim desde `constants.ts` y desde los literales
 * que vivían dentro del JSX. Es la fuente por defecto: `getLandingCopy` cae acá
 * cuando una clave falta en otro idioma.
 */
export const en: LandingCopy = {
	// `nav`, `footer` y `chrome` viven en `core.ts` porque el chrome es cliente y no
	// puede arrastrar el resto del diccionario al bundle. Acá se reutilizan.
	nav: CORE_COPY.en.nav,
	profile: {
		eyebrow: "Available for freelance · Barranquilla, Colombia",
		tagline:
			"I build production web software — Next.js, React and TypeScript. I also review architecture before the wrong decisions get expensive.",
		bio: "Full-stack developer with a background in architecture and graphic design. I build clear interfaces and the APIs behind them. I have worked with teams in Colombia and abroad.",
	},
	jobs: {
		Everus: {
			role: "Full Stack Developer",
			description:
				"Built and scaled the main full-stack web applications and the backend APIs for an AI-powered smart-matching platform.",
		},
		PatientStudio: {
			role: "Front-End Developer",
			description:
				"Built and improved features for PatientStudio's healthcare platform, with a cross-functional team of backend developers and UX/UI designers. Built responsive interfaces in React and TypeScript and kept the components consistent in Storybook. Worked in agile sprints tracked in Jira and fixed client issues on the live platform.",
		},
		"Gwocu Studio": {
			role: "Solutions Engineer",
			description:
				"Helped API consumers use workflow automation tools to simplify their processes. Gave consulting support to improve product features.",
		},
		"App Academy": {
			role: "Technical Staff",
			description:
				"Debugged student portfolio projects and gave technical help to improve their code. Ran office hours to explain concepts and to prepare job seekers for interviews.",
		},
		"PNG Technology Solutions": {
			role: "Full Stack Developer",
			description:
				"Designed and built custom software for clients and matched each project to their requirements. Ran regular consultation calls to capture the project details and to keep communication clear.",
		},
		Henry: {
			role: "Programming Mentor",
			description:
				"Guided students through programming exercises and gave targeted help to build their confidence. Designed exercises that encouraged problem-solving and the mastery of core concepts.",
		},
	},
	projects: {
		"frieda-player": {
			title: "Frieda Player",
			description:
				"A frameless desktop card that mirrors whatever is playing through Windows' media controls and tints itself from the album artwork.",
			highlights: [
				"Event-driven, zero polling",
				"Album-artwork color grading",
				"System tray resident",
				"Native Windows integration",
				"Alpha",
			],
		},
		"visor-credito": {
			title: "Visor de Crédito Hipotecario",
			description:
				"Free mortgage simulator for Colombia that models UVR and pesos amortization under Ley 546/1999 — no other free tool applies the local rules.",
			highlights: [
				"UVR and pesos amortization",
				"Ley 546/1999 and FRECH/FNA rules",
				"CSV export",
				"Free, no signup",
			],
		},
		"twitter-threads": {
			title: "Twitter Thread Unroller",
			description:
				"Paste an X/Twitter thread URL and get back a clean, readable article — built to route around the complexity of the X API.",
			highlights: [
				"One-click unroll",
				"Readable article output",
				"No signup required",
				"Free tool",
			],
		},
		"barranquilla-verde": {
			title: "Barranquilla Verde",
			description:
				"Block-level spatial study of Barranquilla: Sentinel-2 vegetation crossed with socioeconomic stratum across 7,761 city blocks.",
			highlights: [
				"7,761 city blocks analysed",
				"NDVI at 10 m resolution",
				"Local Moran's I (LISA) clustering",
				"Walkability computed from OpenStreetMap",
				"Open data only",
			],
		},
		"doctor-portal": {
			title: "Doctor Portal",
			description:
				"Built new features for the PatientStudio doctor portal and added AI functionality.",
			highlights: [
				"AI Integration",
				"User Experience Improvement",
				"Medical Software",
				"UX/UI",
			],
		},
		invoify: {
			title: "Invoify — OSS Contribution",
			description:
				"Open-source contribution to Invoify, a 6.3k-star invoice generator: fixed PDF generation in Firefox and rebuilt the theme toggle.",
			highlights: [
				"Merged into a 6.3k-star project",
				"Fixed Firefox PDF generation (issue #11)",
				"PDFs download as attachments again",
				"3 files changed, +303/−392",
			],
		},
		"nectar-tint": {
			title: "Nectar — OSS Contribution",
			description:
				"Open-source contribution to Nectar, a GPLv3 notch and dock for Windows: ported Frieda Player's album-art palette extraction so the music panel tints itself from the current cover.",
			highlights: [
				"Merged into a GPLv3 Windows app",
				"Ported the palette algorithm from Frieda Player",
				"Text contrast chosen automatically (WCAG 4.5:1)",
				"Opt-in setting, off by default",
				"9 files changed, +284/−6",
			],
		},
	},
	serviceTracks: {
		landing: {
			eyebrow: "No website yet",
			title: "One-page website, ready for search",
			description:
				"A single page that presents your business, explains what you sell and lets visitors contact you. I build it with the simplest tool that fits the job, so it stays fast and cheap to host.",
			items: [
				"One page with the offer, the proof and the contact details",
				"Section structure and page hierarchy",
				"Search setup: titles, descriptions and sitemap",
				"Load speed and mobile layout checked before delivery",
				"Contact form connected to your inbox",
			],
		},
		build: {
			eyebrow: "Established business",
			title: "Custom tool or technical review",
			description:
				"For work that needs software: a portal, an internal tool, an API, or a new feature on a product you already run. We agree the scope in writing before the work starts.",
			items: [
				"Written scope and estimate before the build",
				"Front end, API and database",
				"React, Next.js and TypeScript",
				"Architecture and code review, on request",
			],
		},
		partner: {
			eyebrow: "Ongoing",
			title: "Monthly development retainer",
			description:
				"A fixed number of development days each month for continued work on your product. We agree the priorities at the start of each month.",
			items: [
				"Fixed days reserved each month",
				"New features, fixes and maintenance",
				"Priority over new project work",
				"Monthly scope agreed in writing",
				"Cancel with notice",
			],
		},
	},
	faq: {
		work: {
			question: "What kind of work do you take on?",
			answer:
				"Freelance work. I build a product or a feature end to end, and I advise on scope, architecture and code review. Most of it is web software in TypeScript.",
		},
		stack: {
			question: "Which parts of the stack do you own?",
			answer:
				"The front end, the API behind it and the deploy. My main tools are React, Next.js, TypeScript, Tailwind, Node, Postgres or Supabase, Vercel and AWS. I have also worked in existing GraphQL and Angular codebases, so I can join an existing codebase instead of starting again.",
		},
		team: {
			question: "Have you worked inside an existing team?",
			answer:
				"Yes. At PatientStudio I worked with backend developers and UX/UI designers on a healthcare platform for medical staff. I built features in React and TypeScript, documented components in Storybook, used GraphQL and tracked sprints in Jira.",
		},
		ai: {
			question: "Can you build AI features?",
			answer:
				"Yes. At Everus I built and scaled the backend of an AI-powered smart-matching platform. At PatientStudio I added AI features to the doctor portal.",
		},
		timezones: {
			question: "How do you work across time zones?",
			answer:
				"I am in Barranquilla, Colombia (UTC−5). That overlaps a full US workday. I have worked remotely with teams in the US and in other countries.",
		},
		start: {
			question: "How does an engagement start?",
			answer:
				"First a 30-minute call to understand what you need. Then a written scope that lists what is included. If it is not a good match, I will tell you on the call.",
		},
	},
	stats: {
		years: "Years building software",
		projects: "Projects and tools",
		articles: "Articles published",
		blocks: "City blocks analysed",
		blocksValue: "7,761",
	},
	hero: {
		featuredWork: "Featured work",
		bookACall: "Book a call",
		emailMe: "Email me",
		seeTheWork: "See the work",
		altText: "William Salas",
	},
	servicesSection: {
		eyebrow: "Services",
		title: "What you can hire, and what it costs.",
		// El valor de diseño va acá y no en una tarjeta propia: no es un producto,
		// es una condición de los tres. Una cuarta tarjeta contradecía el "tres
		// servicios" del título y no se podía comprar.
		description:
			"Each service lists the deliverables and the price. Design is part of all three: type, spacing, color and layout are decisions, not defaults.",
		cta: "Not sure which one you need? Book a 30-minute call →",
		priceFrom: "from",
		priceOnce: "one-time",
		pricePerMonth: "/mo",
		askWhatsApp: "Ask on WhatsApp",
		bookCall: "Book a call",
		whatsappMessage:
			"Hi William, I am interested in {service} ({price}). Can we talk about scope?",
	},
	workSection: {
		eyebrow: "Selected work",
		title: "What I built, and how it works",
		description:
			"My own tools, client work and one open-source contribution. Each row shows what it does, the stack behind it and the highlights.",
		highlights: "Highlights",
		gallery: "Gallery",
		viewLive: "View Live",
		viewCode: "View Code",
		close: "Close",
		screenshotSuffix: "screenshot",
	},
	experienceSection: {
		showMore: "Show More",
		showLess: "Show Less",
	},
	journalSection: {
		eyebrow: "Journal",
		title: "Writing, when something is worth explaining",
		description:
			"Longer pieces about the parts of the work that do not fit in a caption.",
		allArticles: "All articles",
	},
	testimonialsSection: {
		eyebrow: "Testimonials",
		title: "What the people I worked with say",
		visitSite: "Visit site",
	},
	faqSection: {
		eyebrow: "FAQ",
		title: "What people ask before the call",
	},
	ctaBand: {
		eyebrow: "Next step",
		title: "Build something that ships.",
		body: "A 30-minute call is enough to know if this is a good match. If it is not, I will tell you on the call.",
		primary: "Book a call",
		secondary: "Email me",
	},
	contact: {
		heading: "Get in Touch",
		emailLabel: "Email",
		responseTimeLabel: "Response Time",
		responseTimeValue: "Usually within 24 hours",
		pitchTitle: "Let's Build Something Amazing",
		pitchBody:
			"Whether it's a web application, mobile app, or just a conversation about technology, I'm always excited to collaborate on new projects.",
		nameLabel: "Name",
		emailFieldLabel: "Email",
		subjectLabel: "Subject",
		messageLabel: "Message",
		namePlaceholder: "John Doe",
		emailPlaceholder: "john@example.com",
		subjectPlaceholder: "Let's discuss a project",
		messagePlaceholder:
			"Tell me about your project, ideas, or just say hello!",
		nameError: "Name must be at least 2 characters",
		emailError: "Please enter a valid email",
		subjectError: "Subject must be at least 3 characters",
		messageError: "Message must be at least 10 characters",
		consentError: "Please accept the privacy policy to continue",
		consentPrefix:
			"I agree to the processing of my personal data to respond to this request, according to the",
		consentLink: "Política de Tratamiento de Datos Personales",
		send: "Send Message",
		sending: "Sending Message...",
		thanks: "Thanks {name}!",
		thanksBody: "I'll get back to you soon.",
		errorTitle: "Error",
		errorBody: "Something went wrong. Please try again.",
	},
	footer: CORE_COPY.en.footer,
	blogCard: {
		readMore: "Read more",
		moreSuffix: "more",
		minutesSuffix: "min",
	},
	chrome: CORE_COPY.en.chrome,
	dates: { present: "Present" },
};

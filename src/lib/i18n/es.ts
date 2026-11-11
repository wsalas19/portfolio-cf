import { CORE_COPY } from "./core";
import type { LandingCopy } from "./types";

/**
 * La copia española.
 *
 * Tono: segunda persona singular con el pronombre omitido ("construyes", no "tú
 * construyes"). La conjugación ya marca la persona, y omitir el pronombre evita
 * el "tú" explícito, que en varias variantes del español suena demasiado directo.
 *
 * Se mantiene el inglés técnico simplificado del original: frases cortas, voz
 * activa, un verbo por idea. Los nombres propios (herramientas, empresas,
 * productos) y las tecnologías no se traducen.
 */
export const es: LandingCopy = {
	// Ver `core.ts`: el chrome es cliente y no puede arrastrar el diccionario entero.
	nav: CORE_COPY.es.nav,
	profile: {
		eyebrow: "Disponible para freelance · Barranquilla, Colombia",
		tagline:
			"Construyo software web en producción: Next.js, React y TypeScript. También reviso la arquitectura antes de que las decisiones equivocadas salgan caras.",
		bio: "Desarrollador full-stack con formación en arquitectura y diseño gráfico. Construyo interfaces claras y las APIs que las sostienen. He trabajado con equipos en Colombia y en el exterior.",
	},
	jobs: {
		Everus: {
			role: "Desarrollador Full Stack",
			description:
				"Construí y escalé las principales aplicaciones web full-stack y las APIs backend de una plataforma de smart-matching con IA.",
		},
		PatientStudio: {
			role: "Desarrollador Front-End",
			description:
				"Construí y mejoré funcionalidades de la plataforma de salud de PatientStudio, con un equipo interdisciplinario de desarrolladores backend y diseñadores UX/UI. Construí interfaces responsivas en React y TypeScript y mantuve los componentes consistentes en Storybook. Trabajé en sprints ágiles con Jira y resolví incidencias de clientes en la plataforma en producción.",
		},
		"Gwocu Studio": {
			role: "Ingeniero de Soluciones",
			description:
				"Ayudé a consumidores de la API a usar herramientas de automatización de flujos para simplificar sus procesos. Di soporte consultivo para mejorar funcionalidades del producto.",
		},
		"App Academy": {
			role: "Staff Técnico",
			description:
				"Depuré proyectos de portafolio de estudiantes y di apoyo técnico para mejorar su código. Ofrecí espacios de tutoría para explicar conceptos y preparar a quienes buscaban empleo para sus entrevistas.",
		},
		"PNG Technology Solutions": {
			role: "Desarrollador Full Stack",
			description:
				"Diseñé y construí software a medida para clientes y ajusté cada proyecto a sus requisitos. Hice llamadas de consulta periódicas para levantar los detalles del proyecto y mantener la comunicación clara.",
		},
		Henry: {
			role: "Mentor de Programación",
			description:
				"Guié a estudiantes en ejercicios de programación y di apoyo puntual para construir su confianza. Diseñé ejercicios que impulsaran la resolución de problemas y el dominio de los conceptos base.",
		},
	},
	projects: {
		"frieda-player": {
			title: "Frieda Player",
			description:
				"Una tarjeta de escritorio sin bordes que refleja lo que esté sonando en los controles multimedia de Windows y se tiñe con la portada del álbum.",
			highlights: [
				"Orientado a eventos, sin polling",
				"Color derivado de la portada del álbum",
				"Vive en la bandeja del sistema",
				"Integración nativa con Windows",
				"Alpha",
			],
		},
		"visor-credito": {
			title: "Visor de Crédito Hipotecario",
			description:
				"Simulador gratuito de crédito hipotecario para Colombia que modela la amortización en UVR y en pesos bajo la Ley 546 de 1999; ninguna otra herramienta gratuita aplica las reglas locales.",
			highlights: [
				"Amortización en UVR y en pesos",
				"Reglas de la Ley 546/1999 y FRECH/FNA",
				"Exportación a CSV",
				"Gratis y sin registro",
			],
		},
		"twitter-threads": {
			title: "Twitter Thread Unroller",
			description:
				"Pega la URL de un hilo de X/Twitter y obtén un artículo limpio y legible; lo construí para sortear la complejidad de la API de X.",
			highlights: [
				"Desenrollado en un clic",
				"Salida como artículo legible",
				"Sin registro",
				"Herramienta gratuita",
			],
		},
		"barranquilla-verde": {
			title: "Barranquilla Verde",
			description:
				"Estudio espacial a nivel de manzana en Barranquilla: vegetación de Sentinel-2 cruzada con el estrato socioeconómico en 7.761 manzanas de la ciudad.",
			highlights: [
				"7.761 manzanas analizadas",
				"NDVI a 10 m de resolución",
				"Clústeres con Moran local (LISA)",
				"Caminabilidad calculada desde OpenStreetMap",
				"Solo datos abiertos",
			],
		},
		"doctor-portal": {
			title: "Doctor Portal",
			description:
				"Construí nuevas funcionalidades para el portal médico de PatientStudio y añadí funciones de IA.",
			highlights: [
				"Integración de IA",
				"Mejora de experiencia de usuario",
				"Software médico",
				"UX/UI",
			],
		},
		invoify: {
			title: "Invoify — Contribución OSS",
			description:
				"Contribución de código abierto a Invoify, un generador de facturas con 6.3k estrellas: corregí la generación de PDF en Firefox y rehice el cambio de tema.",
			highlights: [
				"Mergeado en un proyecto de 6.3k estrellas",
				"Corregí la generación de PDF en Firefox (issue #11)",
				"Los PDF vuelven a descargarse como adjuntos",
				"3 archivos modificados, +303/−392",
			],
		},
		"nectar-tint": {
			title: "Nectar — Contribución OSS",
			description:
				"Contribución de código abierto a Nectar, una app GPLv3 de notch y dock para Windows: porté la extracción de paleta de la portada de Frieda Player para que el panel de música se tiña con la carátula actual.",
			highlights: [
				"Mergeado en una app GPLv3 para Windows",
				"Porté el algoritmo de paleta de Frieda Player",
				"Contraste de texto automático (WCAG 4.5:1)",
				"Ajuste opcional, desactivado por defecto",
				"9 archivos modificados, +284/−6",
			],
		},
	},
	serviceTracks: {
		landing: {
			eyebrow: "Sin página web",
			title: "Sitio inicial",
			description:
				"Una página que presenta tu negocio, explica qué vendes y permite que te contacten. La construyo con la herramienta más simple que sirva, para que cargue rápido y sea económica de mantener.",
			items: [
				"Una página con la oferta, la prueba y los datos de contacto",
				"Estructura de secciones y jerarquía de la página",
				"SEO base: títulos, descripciones y sitemap",
				"Velocidad de carga y diseño móvil revisados antes de entregar",
				"Formulario de contacto conectado a tu correo",
			],
		},
		build: {
			eyebrow: "Negocio establecido",
			title: "Desarrollo a la medida",
			description:
				"Para trabajo que necesita software: un portal, una herramienta interna, una API o una funcionalidad nueva sobre un producto que ya tienes. Acordamos el alcance por escrito antes de empezar.",
			items: [
				"Alcance y estimación por escrito antes de construir",
				"Interfaz, API y base de datos",
				"React, Next.js y TypeScript",
				"Revisión de arquitectura y código, si es lo que necesitas",
			],
		},
		partner: {
			eyebrow: "Continuo",
			title: "Plan de crecimiento",
			description:
				"Una cantidad fija de días de desarrollo al mes para trabajo continuo sobre tu producto. Acordamos las prioridades al inicio de cada mes.",
			items: [
				"Días reservados cada mes",
				"Funcionalidades nuevas, arreglos y mantenimiento",
				"Prioridad sobre proyectos nuevos",
				"Alcance mensual acordado por escrito",
				"Se cancela con aviso",
			],
		},
	},
	faq: {
		work: {
			question: "¿Qué tipo de trabajo aceptas?",
			answer:
				"Trabajo freelance. Construyo un producto o una funcionalidad de principio a fin, y asesoro en alcance, arquitectura y revisión de código. Casi todo es software web en TypeScript.",
		},
		stack: {
			question: "¿Qué partes del stack dominas?",
			answer:
				"El front end, la API detrás y el despliegue. Mis herramientas principales son React, Next.js, TypeScript, Tailwind, Node, Postgres o Supabase, Vercel y AWS. También he trabajado en bases de código existentes en GraphQL y Angular, así que puedo sumarme a un código que ya existe en vez de empezar de cero.",
		},
		team: {
			question: "¿Has trabajado dentro de un equipo existente?",
			answer:
				"Sí. En PatientStudio trabajé con desarrolladores backend y diseñadores UX/UI en una plataforma de salud para personal médico. Construí funcionalidades en React y TypeScript, documenté componentes en Storybook, usé GraphQL y seguí los sprints en Jira.",
		},
		ai: {
			question: "¿Puedes construir funcionalidades con IA?",
			answer:
				"Sí. En Everus construí y escalé el backend de una plataforma de smart-matching con IA. En PatientStudio añadí funciones de IA al portal médico.",
		},
		timezones: {
			question: "¿Cómo trabajas a través de husos horarios?",
			answer:
				"Estoy en Barranquilla, Colombia (UTC−5). Eso da solapamiento completo con una jornada de Estados Unidos. He trabajado en remoto con equipos en Estados Unidos y en otros países.",
		},
		start: {
			question: "¿Cómo empieza un proyecto?",
			answer:
				"Primero una llamada de 30 minutos para entender qué necesitas. Después un alcance por escrito que lista lo que está incluido. Si no encajamos, te lo digo en la llamada.",
		},
	},
	stats: {
		years: "Años construyendo software",
		projects: "Proyectos y herramientas",
		articles: "Artículos publicados",
		blocks: "Manzanas analizadas",
		blocksValue: "7.761",
	},
	hero: {
		featuredWork: "Trabajo destacado",
		bookACall: "Agenda",
		emailMe: "Escríbeme",
		seeTheWork: "Ver el trabajo",
		altText: "William Salas",
	},
	servicesSection: {
		eyebrow: "Servicios",
		title: "Qué puedes contratar, y cuánto cuesta.",
		description:
			"Cada servicio lista lo que incluye y el precio. El diseño es parte de los tres: tipografía, espaciado, color y composición son decisiones, no valores por defecto.",
		cta: "¿No sabes cuál necesitas? Agenda una llamada de 30 minutos →",
		priceFrom: "desde",
		priceOnce: "pago único",
		pricePerMonth: "/mes",
		askWhatsApp: "Preguntar por WhatsApp",
		bookCall: "Agendar llamada",
		whatsappMessage:
			"Hola William, me interesa {service} ({price}). ¿Podemos hablar del alcance?",
	},
	workSection: {
		eyebrow: "Trabajo seleccionado",
		title: "Lo que construí y cómo funciona",
		description:
			"Mis propias herramientas, trabajo para clientes y una contribución de código abierto. Cada fila muestra qué hace, el stack detrás y los puntos destacados.",
		highlights: "Puntos destacados",
		gallery: "Galería",
		viewLive: "Ver en vivo",
		viewCode: "Ver código",
		close: "Cerrar",
		screenshotSuffix: "captura",
	},
	experienceSection: {
		showMore: "Ver más",
		showLess: "Ver menos",
	},
	journalSection: {
		eyebrow: "Bitácora",
		title: "Escribo cuando algo merece explicarse",
		description:
			"Textos más largos sobre las partes del trabajo que no caben en un pie de foto.",
		allArticles: "Todos los artículos",
	},
	testimonialsSection: {
		eyebrow: "Testimonios",
		title: "Lo que dicen las personas con las que trabajé",
		visitSite: "Ver sitio",
	},
	faqSection: {
		eyebrow: "Preguntas",
		title: "Lo que preguntan antes de la llamada",
	},
	ctaBand: {
		eyebrow: "Siguiente paso",
		title: "Construyamos algo que llegue a producción.",
		body: "Una llamada de 30 minutos basta para saber si encajamos. Si no, te lo digo en la llamada.",
		primary: "Agenda una llamada",
		secondary: "Escríbeme",
	},
	contact: {
		heading: "Hablemos",
		emailLabel: "Correo",
		responseTimeLabel: "Tiempo de respuesta",
		responseTimeValue: "Normalmente en menos de 24 horas",
		pitchTitle: "Construyamos algo bueno",
		pitchBody:
			"Ya sea una aplicación web, una app móvil o solo una conversación sobre tecnología, siempre me entusiasma colaborar en proyectos nuevos.",
		nameLabel: "Nombre",
		emailFieldLabel: "Correo",
		subjectLabel: "Asunto",
		messageLabel: "Mensaje",
		namePlaceholder: "Juan Pérez",
		emailPlaceholder: "juan@ejemplo.com",
		subjectPlaceholder: "Hablemos de un proyecto",
		messagePlaceholder: "Cuéntame de tu proyecto, tus ideas, o solo saluda.",
		nameError: "El nombre debe tener al menos 2 caracteres",
		emailError: "Ingresa un correo válido",
		subjectError: "El asunto debe tener al menos 3 caracteres",
		messageError: "El mensaje debe tener al menos 10 caracteres",
		consentError: "Acepta la política de privacidad para continuar",
		consentPrefix:
			"Acepto el tratamiento de mis datos personales para responder a esta solicitud, según la",
		consentLink: "Política de Tratamiento de Datos Personales",
		send: "Enviar mensaje",
		sending: "Enviando mensaje...",
		thanks: "¡Gracias, {name}!",
		thanksBody: "Te respondo pronto.",
		errorTitle: "Error",
		errorBody: "Algo salió mal. Inténtalo de nuevo.",
	},
	footer: CORE_COPY.es.footer,
	blogCard: {
		readMore: "Leer más",
		moreSuffix: "más",
		minutesSuffix: "min",
	},
	chrome: CORE_COPY.es.chrome,
	dates: { present: "Actualidad" },
};

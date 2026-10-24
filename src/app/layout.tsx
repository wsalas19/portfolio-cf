import "./globals.css";

import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ScrollButton from "@/components/ScrollButton";
import { Toaster } from "@/components/ui/toaster";
import { Carme, Inter } from "next/font/google";
import { env } from "@/lib/env";
import { PROFILE, SOCIAL_LINKS } from "@/lib/constants";
import { getLandingContent } from "@/lib/i18n";

// metadataBase hace absolutas las `alternates.canonical` relativas de cada ruta.
export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
};

const carme = Carme({
	weight: "400",
	style: "normal",
	subsets: ["latin"],
	variable: "--font-carme",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const SITE_URL = "https://www.wsalas.com";

/**
 * Un `@graph` y no dos `<script>`: el `Person` de siempre más el
 * `ProfessionalService` que faltaba. Sin él, el sitio declaraba quién es la
 * persona pero no que hubiera algo contratable — que es justamente lo que la
 * página ahora vende.
 *
 * Las ofertas salen de `serviceTracks`, saltando el track de proceso (no es algo
 * que se contrate): el schema no puede desincronizarse del contenido visible.
 */
const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Person",
			"@id": `${SITE_URL}/#person`,
			name: "William Salas",
			url: SITE_URL,
			sameAs: [SOCIAL_LINKS.linkedin, SOCIAL_LINKS.github],
			jobTitle: "Full Stack Developer",
			description:
				"William Salas is a Full Stack Developer and Software Engineer specializing in React, TypeScript, Next.js, and modern web technologies.",
			knowsAbout: [
				"React",
				"TypeScript",
				"Next.js",
				"JavaScript",
				"Tailwind CSS",
				"Node.js",
				"PostgreSQL",
				"AWS",
				"GraphQL",
				"Full Stack Development",
				"Web Development",
				"Software Engineering",
			],
			worksFor: [
				{
					"@type": "Organization",
					name: "Everus",
					url: "https://everuscares.com",
				},
			],
			alumniOf: [
				{
					"@type": "EducationalOrganization",
					name: "soyHenry",
				},
				{
					"@type": "EducationalOrganization",
					name: "Universidad Nacional de Colombia",
				},
			],
		},
		// El `WebSite` es lo único que le dice a Google cómo se llama el sitio; con
		// `name` + `url` habilita el nombre en los resultados en vez del dominio.
		// Tiene que decir lo mismo que el `og:site_name` de `page.tsx`, o Google no
		// lo consolida y sigue mostrando el dominio.
		{
			"@type": "WebSite",
			"@id": `${SITE_URL}/#website`,
			url: SITE_URL,
			name: "William Salas Portfolio",
			author: { "@id": `${SITE_URL}/#person` },
		},
		{
			"@type": "ProfessionalService",
			"@id": `${SITE_URL}/#service`,
			name: "William Salas — Software Development & Technical Review",
			url: SITE_URL,
			description:
				"Freelance full-stack product development and technical review: Next.js, React and TypeScript web applications, the APIs behind them, and the architecture decisions before they get expensive to change.",
			areaServed: "Worldwide",
			address: {
				"@type": "PostalAddress",
				addressLocality: "Barranquilla",
				addressCountry: PROFILE.country,
			},
			provider: { "@id": `${SITE_URL}/#person` },
			// El JSON-LD es del sitio en inglés (la única versión indexable del
			// `ProfessionalService`), así que se hidratan las semillas con `en`.
			// Se filtra por `price` y no por id: antes decía `id !== "process"`,
			// un id escrito a mano que dejaba de excluir nada en cuanto se
			// renombraba un track. Los precios van en USD (la moneda de
			// referencia); el precio en pesos depende del visitante y no puede
			// vivir en un JSON-LD estático.
			makesOffer: getLandingContent("en").serviceTracks
				.filter((track) => track.price)
				.map((track) => ({
					"@type": "Offer",
					...(track.pricePeriod === "month"
						? {
								priceSpecification: {
									"@type": "UnitPriceSpecification",
									price: track.price?.usd,
									priceCurrency: "USD",
									unitCode: "MON",
								},
							}
						: {
								price: track.price?.usd,
								priceCurrency: "USD",
							}),
					itemOffered: {
						"@type": "Service",
						name: track.title,
						description: track.description,
					},
				})),
		},
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${carme.variable} ${inter.variable}`}>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className="font-sans">
				<NavBar />
				{children}
				<Footer />
				<Toaster />
				<ScrollButton />
			</body>
		</html>
	);
}

import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { env } from "@/lib/env";
import { FAQ } from "./data";

const mono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-credito-mono",
});

const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
const TITLE = "Simulador de Crédito Hipotecario Colombia — Cuota UVR y Pesos";
const DESCRIPTION =
	"Calcula gratis tu crédito hipotecario en Colombia: cuota mensual, intereses, seguros y abonos a capital. Simula la línea UVR y la línea pesos con tasas de referencia FNA, FRECH y Ley 546/1999, y elige si tu abono reduce el plazo o la cuota.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	keywords: [
		"simulador crédito hipotecario Colombia",
		"calculadora crédito hipotecario",
		"cuota crédito hipotecario",
		"calculadora UVR",
		"crédito UVR Colombia",
		"crédito hipotecario VIS",
		"crédito hipotecario VIP",
		"FNA crédito hipotecario",
		"FRECH",
		"Ley 546 de 1999",
		"abono a capital crédito hipotecario",
		"reducir cuota crédito hipotecario",
		"reducir plazo crédito hipotecario",
	],
	alternates: { canonical: "/visor-credito" },
	robots: { index: true, follow: true },
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		url: `${SITE_URL}/visor-credito`,
		siteName: "William Salas",
		locale: "es_CO",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: TITLE,
		description:
			"Simula tu crédito hipotecario en Colombia: cuota, intereses y abonos a capital en UVR o pesos. Gratis y sin registro.",
	},
};

const appJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "Simulador de Crédito Hipotecario Colombia",
	url: `${SITE_URL}/visor-credito`,
	applicationCategory: "FinanceApplication",
	operatingSystem: "Web",
	inLanguage: "es-CO",
	description: DESCRIPTION,
	offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
	author: {
		"@type": "Person",
		name: "William Salas",
		url: SITE_URL,
	},
};

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: FAQ.map(({ q, a, sources }) => ({
		"@type": "Question",
		name: q,
		acceptedAnswer: {
			"@type": "Answer",
			text: a,
			...(sources?.length ? { citation: sources.map((s) => s.url) } : {}),
		},
	})),
};

export default function VisorCreditoLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className={`${mono.variable} contents`}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
			/>
			{children}
		</div>
	);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	const doc = await getLegalDoc("terminos");
	return {
		title: doc?.title,
		description: doc?.excerpt,
		alternates: { canonical: "/terminos" },
		robots: { index: true, follow: true },
		openGraph: {
			title: doc?.title,
			description: doc?.excerpt,
			url: "https://www.wsalas.com/terminos",
			siteName: "William Salas",
			locale: "es_CO",
			type: "website",
		},
	};
}

export default async function TerminosPage() {
	const doc = await getLegalDoc("terminos");
	if (!doc) notFound();
	return <LegalDocument doc={doc} />;
}

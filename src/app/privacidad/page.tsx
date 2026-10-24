import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	const doc = await getLegalDoc("privacidad");
	return {
		title: doc?.title,
		description: doc?.excerpt,
		alternates: { canonical: "/privacidad" },
		robots: { index: true, follow: true },
		openGraph: {
			title: doc?.title,
			description: doc?.excerpt,
			url: "https://www.wsalas.com/privacidad",
			siteName: "William Salas",
			locale: "es_CO",
			type: "website",
		},
	};
}

export default async function PrivacidadPage() {
	const doc = await getLegalDoc("privacidad");
	if (!doc) notFound();
	return <LegalDocument doc={doc} />;
}

import { Metadata } from "next";
import { ToolGrid } from "@/components/tools/ToolGrid";

export const metadata: Metadata = {
	title: "Tools | William Salas",
	description:
		"Free browser tools by William Salas: X/Twitter thread reader and a Colombian mortgage credit simulator.",
	alternates: { canonical: "/tools" },
	openGraph: {
		title: "Tools | William Salas",
		description:
			"Free browser tools: X/Twitter thread reader and a Colombian mortgage credit simulator.",
		url: "https://www.wsalas.com/tools",
		siteName: "William Salas Portfolio",
		type: "website",
	},
};

export default function ToolsPage() {
	return (
		<div className="min-h-screen py-12 px-4 pb-32 md:px-8 lg:px-16">
			<div className="max-w-7xl mx-auto">
				<header className="mb-12">
					<h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
						Tools
					</h1>
					<p className="text-xl text-gray-300">
						Small utilities I build and ship — free to use, no signup.
					</p>
				</header>

				<ToolGrid />
			</div>
		</div>
	);
}

import Link from "next/link";
import { Landmark, Newspaper, ArrowRight, Wrench } from "lucide-react";

interface Tool {
	name: string;
	description: string;
	href: string;
	icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const TOOLS: Tool[] = [
	{
		name: "Thread Viewer",
		description:
			"Paste any X/Twitter thread URL and get a clean, readable article — no signup, results in seconds.",
		href: "/twitter-threads",
		icon: Newspaper,
	},
	{
		name: "Visor de Crédito Hipotecario",
		description:
			"Simulador de crédito hipotecario para Colombia: amortización, seguros y abonos a capital · Ley 546/1999. Línea UVR y línea pesos.",
		href: "/visor-credito",
		icon: Landmark,
	},
];

export function ToolGrid() {
	if (TOOLS.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-400">No tools yet. Check back soon!</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{TOOLS.map((tool) => (
				<Link key={tool.href} href={tool.href}>
					<article
						className="glass flex h-[280px] flex-col justify-between rounded-lg p-6 transition-all duration-200 hover:glass-strong hover:scale-[1.02] group"
					>
						<div className="flex flex-col gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-palette-lime">
								<tool.icon size={20} />
							</div>
							<h2 className="font-display text-2xl font-bold text-white">
								{tool.name}
							</h2>
						</div>

						<div className="flex flex-col gap-4">
							<p className="line-clamp-3 text-gray-300">{tool.description}</p>
							<div className="flex items-center gap-2 text-palette-lime transition-colors group-hover:text-palette-lime">
								<Wrench size={15} />
								<span className="font-medium">Open tool</span>
								<ArrowRight
									size={16}
									className="transition-transform group-hover:translate-x-1"
								/>
							</div>
						</div>
					</article>
				</Link>
			))}
		</div>
	);
}

import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";
import type { LandingCopy, LandingProfile } from "@/lib/i18n";
import type { Project } from "@/lib/types/globals";

const ITEM =
	"focus-ring group flex flex-col gap-1 transition-colors";

interface StatsProps {
	copy: LandingCopy;
	profile: LandingProfile;
	projects: Project[];
}

/**
 * Tres números, y ninguno escrito a mano: si un post se publica o un proyecto se
 * agrega, el número cambia solo. Cada uno enlaza a su fuente, que es lo que hace
 * la afirmación verificable de un clic en vez de una cifra que hay que creer.
 */
async function Stats({ copy, profile, projects }: StatsProps) {
	const years = new Date().getFullYear() - profile.experienceStart;
	const postCount = (await getAllPosts()).length;

	// Con menos de tres artículos la ranura se lee pobre. El estudio de
	// Barranquilla tiene su propia cifra dura, ya publicada y enlazable.
	// ponytail: umbral a ojo; si el blog pasa de tres posts, esta rama muere sola.
	const stats = [
		{ value: `${years}`, label: copy.stats.years, href: "#experience" },
		// "Projects and tools" y no "Public projects & tools": los seis incluyen una
		// contribución a un repo ajeno y un portal privado, así que "public" no era
		// cierto para todos. "Studies published" tampoco: un estudio es Barranquilla
		// Verde; los otros cinco son artículos.
		{ value: `${projects.length}`, label: copy.stats.projects, href: "#projects" },
		postCount >= 3
			? { value: `${postCount}`, label: copy.stats.articles, href: "/blog" }
			: {
					value: copy.stats.blocksValue,
					label: copy.stats.blocks,
					href: "/blog/barranquilla-verde-desigualdad-2026",
				},
	];

	return (
		<section className="pb-4 md:pb-8">
			<div className="container-page">
				<div className="grid grid-cols-1 gap-8 border-y border-white/10 py-10 sm:grid-cols-3 md:gap-4">
					{stats.map((stat) => {
						const inner = (
							<>
								<span className="font-display text-4xl font-bold text-white transition-colors group-hover:text-palette-lime md:text-5xl">
									{stat.value}
								</span>
								<span className="text-xs uppercase tracking-[0.2em] text-gray-400">
									{stat.label}
								</span>
							</>
						);

						return stat.href.startsWith("/") ? (
							<Link key={stat.label} href={stat.href} className={ITEM}>
								{inner}
							</Link>
						) : (
							<a key={stat.label} href={stat.href} className={ITEM}>
								{inner}
							</a>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default Stats;

import Image from "next/image";
import { Mail, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CALENDAR_URL, CONTACT_EMAIL, imgSize } from "@/lib/constants";
import { fillTemplate } from "@/lib/pricing";
import type { LandingCopy, LandingProfile } from "@/lib/i18n";
import type { Project } from "@/lib/types/globals";

interface HeroProps {
	copy: LandingCopy;
	profile: LandingProfile;
	projects: Project[];
}

// Sin "use client": las entradas son `.rise`/`.pop` con `[--rise-delay]`, que es
// CSS. El HTML del servidor sale visible y el LCP no espera a la hidratación —
// la misma razón por la que el `ProfileCard` que esto reemplaza no usaba
// framer-motion.
function Hero({ copy, profile, projects }: HeroProps) {
	// El panel destacado sale de `projects` por slug y no de un objeto propio: si el
	// proyecto cambia de descripción o de portada, el hero lo sigue solo.
	const featured =
		projects.find((project) => project.slug === "barranquilla-verde") ??
		projects[0];

	// Los dos números de la prueba se derivan, igual que en `Stats`: cambiar
	// `experienceStart` o sumar un proyecto actualiza el hero sin tocarlo.
	const years = new Date().getFullYear() - profile.experienceStart;

	return (
		<section id="about" className="py-20 md:py-32">
			<div className="container-page">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
					{/* Izquierda: quién es y qué se puede contratar. */}
					<div className="flex flex-col justify-center">
						<div className="rise flex items-center gap-3">
							<Image
								src="/images/profile-img.png"
								alt={copy.hero.altText}
								width={imgSize}
								height={imgSize}
								priority
								sizes="56px"
								className="h-14 w-14 rounded-full object-cover ring-1 ring-white/15"
							/>
							<span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-palette-lime">
								{profile.eyebrow}
							</span>
						</div>

						<h1 className="rise [--rise-delay:100ms] mt-6 font-display text-3xl font-bold tracking-tight text-gradient-primary text-balance md:text-5xl lg:text-6xl">
							{copy.hero.headline}
						</h1>

						{/* El nombre era el H1 y se llevaba el único tipo grande de la
						    página: el visitante leía quién es antes de saber qué se
						    compra. Ahora firma la frase, con una regla corta delante. */}
						<p className="rise [--rise-delay:150ms] mt-5 flex items-center gap-3 text-sm font-semibold text-gray-300">
							<span aria-hidden className="h-px w-8 bg-palette-lime/60" />
							{profile.name}
						</p>

						<p className="rise [--rise-delay:200ms] mt-6 max-w-xl text-lg leading-relaxed text-gray-200 text-balance md:text-xl">
							{profile.tagline}
						</p>

						{/* La prueba dura, arriba del pliegue. Cada cifra enlaza a su
						    fuente, como en `Stats`: la afirmación se puede verificar. */}
						<div className="rise [--rise-delay:250ms] mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
							<a
								href="#experience"
								className="focus-ring transition-colors hover:text-palette-lime"
							>
								{fillTemplate(copy.hero.proofYears, { years: String(years) })}
							</a>
							<span aria-hidden className="text-white/25">
								·
							</span>
							<a
								href="#projects"
								className="focus-ring transition-colors hover:text-palette-lime"
							>
								{fillTemplate(copy.hero.proofProjects, {
									projects: String(projects.length),
								})}
							</a>
						</div>

						<div className="rise [--rise-delay:300ms] mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
							<Button variant="green" size="lg" asChild className="glow-lime-hover w-full sm:w-auto">
								<a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
									<Video className="mr-2 h-5 w-5" />
									{copy.hero.bookACall}
								</a>
							</Button>
							<Button variant="glass" size="lg" asChild>
								<a href={`mailto:${CONTACT_EMAIL}`}>
									<Mail className="mr-2 h-5 w-5" />
									{copy.hero.emailMe}
								</a>
							</Button>
							{/* Era un botón con `bg-[#495533]/40`, el color de un control
							    deshabilitado. Tres botones de peso parecido no tienen
							    jerarquía; el tercero es un enlace. */}
							<a
								href="#projects"
								className="focus-ring inline-flex items-center justify-center gap-2 px-2 py-2 font-semibold text-palette-lime transition-colors hover:text-palette-olive sm:self-center"
							>
								{copy.hero.seeTheWork}
								<ArrowRight className="h-4 w-4" />
							</a>
						</div>

						<p className="rise [--rise-delay:200ms] mt-6 text-lg leading-relaxed text-gray-300">
							{profile.bio}
						</p>

						{/* Las píldoras van en la columna de la persona, no encima de la
						    tarjeta de trabajo: arriba a la derecha se leían como el stack
						    del proyecto destacado, y ese proyecto es Python y Google Earth
						    Engine. En `text-xs` cierran el bio como nota al pie y no
						    compiten con el H1, que es lo que pasaba con `text-sm` en la
						    primera fila. */}
						<div className="rise [--rise-delay:300ms] mt-6 flex flex-wrap gap-2">
							{profile.skills.map((skill) => (
								<span
									key={skill}
									className="rounded-full border border-palette-pink/20 glass-pink px-2.5 py-1 text-xs font-medium text-palette-pink"
								>
									{skill}
								</span>
							))}
						</div>
					</div>

					{/* Derecha: la prueba inmediata, el trabajo destacado. */}
					<div className="flex flex-col justify-center">
						<a
							href="#projects"
							// El `alt` de la portada repetía el título que el <h2> de abajo ya
							// anuncia: el lector de pantalla lo oía dos veces. Y el enlace
							// prometía el proyecto y llevaba a la lista, así que el nombre
							// accesible dice a dónde va.
							aria-label={`${featured.title} — ${copy.workSection.eyebrow}`}
							className="rise [--rise-delay:400ms] glass group block overflow-hidden rounded-2xl transition-all duration-300 hover:glass-strong"
						>
							<div className="relative aspect-[16/10] w-full overflow-hidden">
								{/* `priority` saca el `loading="lazy"` y emite el `<link rel=preload>`,
								    pero Next 15 no deriva `fetchpriority` de él: hay que pasarlo
								    aparte (get-img-props.js solo lo reenvía si se le da). */}
								<Image
									src={featured.imageUrl}
									alt=""
									fill
									priority
									fetchPriority="high"
									sizes="(max-width: 1024px) 100vw, 520px"
									className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-palette-canvas via-palette-canvas/30 to-transparent" />
							</div>
							<div className="p-5">
								<span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-palette-lime">
									{copy.hero.featuredWork}
								</span>
								<h2 className="mt-2 font-display text-xl font-bold text-white">
									{featured.title}
								</h2>
								<p className="mt-1 line-clamp-2 text-sm text-gray-300">
									{featured.description}
								</p>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{featured.technologies.slice(0, 3).map((tech) => (
										<span
											key={tech}
											className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-gray-400"
										>
											{tech}
										</span>
									))}
								</div>
							</div>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Hero;

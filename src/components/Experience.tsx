"use client";
import React, { useEffect, useState } from "react";
import ExperienceCard from "./ExperienceCard";
import { SectionHeading } from "./SectionHeading";
import { Button } from "./ui/button";
import { PROFILE } from "@/lib/constants";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LandingCopy } from "@/lib/i18n";
import type { jobProps } from "@/lib/types/globals";

interface ExperienceProps {
	copy: LandingCopy;
	jobs: jobProps[];
}

function Experience({ copy, jobs }: ExperienceProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	// La primera tarjeta arranca activa. Antes un efecto hacía `setActiveIndex(0)`
	// al montar y provocaba un render extra para pintar exactamente lo que el
	// primer render ya puede pintar con este valor inicial.
	const [activeIndex, setActiveIndex] = useState<number | null>(0);

	// Auto-animate the first card after component mount
	useEffect(() => {
		const timer = setTimeout(() => setActiveIndex(null), 1000);
		return () => clearTimeout(timer);
	}, []);

	const visibleJobs = isExpanded ? jobs : jobs.slice(0, 2);

	return (
		<section id="experience" className="py-20 md:py-32">
			<div className="container-page">
				{/* La nav enlaza a `#experience` desde `paths`, así que la sección
				    necesitaba un título: sin él el enlace aterrizaba en una línea de
				    tiempo anónima y no se sabía si se había llegado a algo nuevo. */}
				<SectionHeading
					eyebrow={copy.experienceSection.eyebrow}
					title={copy.experienceSection.title}
				/>
				{/* Timeline */}
				<div className="flex justify-center">
					<div className="w-[80%] md:w-full max-w-4xl">
						<ol className="relative border-s-2 border-gray-400 space-y-10">
							{visibleJobs.map((job, index) => (
								<li
									key={job.company}
									// La escala quedaba en el <li>, que mide todo el ancho de la
									// columna: 5% de eso es un salto de decenas de píxeles.
									// El énfasis lo da `ExperienceCard` sobre el contenido.
									onMouseEnter={() => setActiveIndex(index)}
									onMouseLeave={() => setActiveIndex(null)}
								>
									<ExperienceCard {...job} isActive={activeIndex === index} />
								</li>
							))}

							{/* Starting Year Marker */}
							{/* El origen del timeline, subordinado a los títulos de puesto: antes
							    iba en text-2xl, el mismo tamaño que "Full Stack Developer". Un
							    año suelto no dice nada; con la etiqueta se lee como el inicio
							    de la trayectoria. */}
							<li className="ms-8 text-lg font-semibold text-gray-400">
								{/* Derivado y no escrito: es el mismo número que `Stats` usa
								    para contar los años, y dos copias se desincronizan. */}
								{copy.experienceSection.startLabel} {PROFILE.experienceStart}
							</li>
						</ol>

						{/* Show More/Less Button */}
						{/* El corte de arriba es slice(0, 2); con > 3 el botón no aparecía
						    con exactamente 3 cargos y el tercero quedaba inalcanzable. */}
						{jobs.length > 2 && (
							<div className="text-center mt-8">
								<Button
									variant="outline"
									onClick={() => setIsExpanded(!isExpanded)}
									className="group rounded-lg transition-all "
								>
									{isExpanded ? (
										<>
											{copy.experienceSection.showLess}
											<ChevronUp className="w-4 h-4 ml-2 group-hover:transform group-hover:scale-125 transition-transform" />
										</>
									) : (
										<>
											{copy.experienceSection.showMore}
											<ChevronDown className="w-4 h-4 ml-2 group-hover:transform group-hover:scale-125 transition-transform" />
										</>
									)}
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default Experience;

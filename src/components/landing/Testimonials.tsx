import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import type { LandingCopy } from "@/lib/i18n";
import type { Testimonial } from "@/lib/types/globals";

/**
 * Las citas de `constants.ts` llegan hidratadas por prop (no se traducen: una
 * cita traducida deja de ser una cita) y se muestran tal cual. Cada persona dio
 * el visto bueno por escrito, así que se publican; el componente sigue
 * devolviendo `null` si el array queda vacío.
 *
 * El `id` es el ancla para el enlace profundo, pero `paths` todavía no lo
 * lista: un enlace a `#testimonials` existiría solo en esta página.
 */
function Testimonials({
	copy,
	testimonials,
}: {
	copy: LandingCopy;
	testimonials: Testimonial[];
}) {
	if (testimonials.length === 0) return null;

	return (
		<section id="testimonials" className="py-20 md:py-32">
			<div className="container-page">
				<SectionHeading
					eyebrow={copy.testimonialsSection.eyebrow}
					title={copy.testimonialsSection.title}
				/>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{testimonials.map((testimonial) => (
						<figure
							key={testimonial.name}
							className="glass flex flex-col rounded-2xl p-7"
						>
							<blockquote className="flex-1 text-lg leading-relaxed text-gray-200">
								&ldquo;{testimonial.quote}&rdquo;
							</blockquote>
							<figcaption className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
								{testimonial.portraitUrl && (
									<Image
										src={testimonial.portraitUrl}
										alt=""
										width={48}
										height={48}
										sizes="48px"
										className="h-12 w-12 rounded-full object-cover"
									/>
								)}
								<div className="text-sm">
									{/* El nombre es el enlace cuando la persona tiene sitio: la
									    cita gana credibilidad si se puede verificar a quién
									    pertenece. El `aria-label` dice que sale del sitio,
									    porque el texto visible solo es el nombre. */}
									<p className="font-semibold text-white">
										{testimonial.url ? (
											<a
												href={testimonial.url}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={`${testimonial.name} — ${copy.testimonialsSection.visitSite}`}
												className="focus-ring inline-flex items-center gap-1.5 rounded-sm hover:text-palette-lime hover:underline"
											>
												{testimonial.name}
												<ExternalLink
													className="h-3.5 w-3.5 text-gray-500"
													aria-hidden="true"
												/>
											</a>
										) : (
											testimonial.name
										)}
									</p>
									<p className="text-gray-400">
										{testimonial.role}
										{testimonial.company ? `, ${testimonial.company}` : ""}
									</p>
								</div>
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}

export default Testimonials;

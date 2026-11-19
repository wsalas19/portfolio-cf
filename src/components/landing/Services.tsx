import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { CALENDAR_URL } from "@/lib/constants";
import type { LandingCopy } from "@/lib/i18n";
import type { ServiceTrack } from "@/lib/types/globals";
import ServicePrice from "./ServicePrice";

interface ServicesProps {
	copy: LandingCopy;
	serviceTracks: ServiceTrack[];
}

/**
 * Lo que hoy no existía en ninguna parte del sitio: la oferta. Cada track sale de
 * `serviceTracks`, y cada afirmación de ahí sale de un trabajo en `jobs`.
 */
function Services({ copy, serviceTracks }: ServicesProps) {
	return (
		<section id="services" className="py-20 md:py-32">
			<div className="container-page">
				<SectionHeading
					eyebrow={copy.servicesSection.eyebrow}
					title={copy.servicesSection.title}
					description={copy.servicesSection.description}
				/>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{serviceTracks.map((track, index) => (
						<div
							key={track.id}
							className="rise glass flex flex-col rounded-2xl p-7 transition-all duration-300 hover:glass-strong"
							style={{ "--rise-delay": `${index * 120}ms` } as CSSProperties}
						>
							<span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-palette-pink">
								{track.eyebrow}
							</span>
							<h3 className="mt-3 font-display text-xl font-bold text-white">
								{track.title}
							</h3>
							<p className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
								{track.description}
							</p>
							<ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
								{track.items.map((item) => (
									<li key={item} className="flex items-start gap-3 text-sm text-gray-300">
										<Check className="mt-0.5 h-4 w-4 shrink-0 text-palette-lime" />
										{item}
									</li>
								))}
							</ul>

							{track.price && (
								<ServicePrice
									price={track.price}
									title={track.title}
									priceFrom={track.priceFrom}
									pricePeriod={track.pricePeriod}
									cta={track.cta}
									copy={copy.servicesSection}
								/>
							)}
						</div>
					))}
				</div>

				<a
					href={CALENDAR_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="focus-ring mt-10 inline-block text-sm font-medium text-palette-lime hover:underline"
				>
					{copy.servicesSection.cta}
				</a>
			</div>
		</section>
	);
}

export default Services;

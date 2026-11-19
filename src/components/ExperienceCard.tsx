import { jobProps } from "@/lib/types/globals";
import { Briefcase } from "lucide-react";
import { Button } from "./ui/button";

interface ExperienceCardProps extends jobProps {
	isActive?: boolean;
}

function ExperienceCard({
	role,
	company,
	endDate,
	startDate,
	description,
	technologies = [],
	companyUrl = "",
	isActive = false,
}: ExperienceCardProps) {
	return (
		<div className="relative mb-10 ms-8">
			{/* Briefcase icon container - moved outside the scaling container */}
			<span
				className={`absolute flex items-center justify-center w-12 h-12
	        rounded-full -start-8 ring-8 ring-transparent bg-palette-pink
	        transition-all duration-300 glow-pink-hover ${isActive ? "scale-110" : ""}`}
				style={{ transform: `translate(-50%, 0)` }}
			>
				<Briefcase className="w-5 h-5 text-gray-900" />
			</span>

			{/* Content container with scale effect */}
			<div
				className={`transition-all duration-300 ${
					isActive ? "transform scale-[1.02]" : ""
				}`}
			>
				<div className="glass p-4 rounded-lg transition-all duration-300 border border-white/10">
					<div className="flex flex-wrap items-center justify-between mb-2">
						<h3 className="flex items-center gap-3 font-display text-2xl font-bold text-white">
							{role}
						</h3>

						{companyUrl ? (
							<Button
								variant="link"
								size="sm"
								className="group flex gap-1 text-lg text-palette-lime hover:text-palette-pink transition-colors"
							>
								<a href={companyUrl}>{company}</a>
							</Button>
						) : (
							<span className="text-gray-400 text-lg font-medium">
								{company}
							</span>
						)}
					</div>

					<time className="block mb-4 text-sm font-semibold leading-none text-gray-400">
						{startDate} - {endDate}
					</time>

					{/* `34rem` y no `65ch`: `ch` es el ancho del "0" de la fuente, y en Inter
					    a 16px son ~10px, así que `65ch` daba 656px ≈ 82 caracteres reales.
					    34rem (544px) sí deja la línea en el rango de 65–70. */}
					<p className="mb-4 max-w-[34rem] text-gray-300 text-pretty">{description}</p>

					{technologies.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-4">
							{technologies.map((tech) => (
								<span
									key={tech}
									className="px-2 py-1 text-xs font-medium rounded-full
	                    glass-pink text-palette-pink
	                    hover:bg-palette-pink/30 transition-all duration-300 border border-palette-pink/20 glow-pink-hover"
								>
									{tech}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default ExperienceCard;

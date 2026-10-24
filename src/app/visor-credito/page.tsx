import CreditoSimulator from "./CreditoSimulator";
import { FAQ } from "./data";

// Contenido server-rendered (crawlable) debajo de la herramienta. lang="es"
// porque el <html> raíz del portafolio declara "en".
export default function VisorCreditoPage() {
	return (
		<>
			<CreditoSimulator />

			<section
				lang="es"
				className="mx-auto max-w-3xl border-t border-white/10 px-4 py-16 text-gray-300 md:px-6"
			>
				<h2 className="font-display text-3xl font-semibold text-white">
					¿Cómo calcular tu crédito hipotecario en Colombia?
				</h2>
				<p className="mt-4 leading-relaxed">
					En Colombia un crédito hipotecario se puede pactar en dos líneas: en{" "}
					<strong className="text-white">pesos</strong>, con una cuota fija que
					no cambia durante la vida del crédito, o en{" "}
					<strong className="text-white">UVR</strong> (Unidad de Valor Real),
					una unidad indexada a la inflación que hace que la cuota en pesos
					suba con el tiempo aunque el saldo en UVR baje. Desde la Ley 546 de
					1999 la UVR es la referencia de la vivienda financiada en Colombia, y
					por eso comparar ambas líneas antes de firmar es clave.
				</p>
				<p className="mt-4 leading-relaxed">
					Esta herramienta estima la amortización mes a mes: cuota exigida,
					intereses, abonos a capital, seguros de vida e incendio/terremoto y
					el total desembolsado hasta el cierre del crédito. Puedes ajustar el
					valor del inmueble, el porcentaje a financiar, el plazo, la tasa
					efectiva anual (E.A.), el valor de la UVR y descuentos de programas
					como FRECH. Si haces un abono adicional, eliges si reduce el plazo
					(misma cuota) o la cuota (mismo plazo), y ves el ahorro de cada
					opción en paralelo.
				</p>
				<p className="mt-4 leading-relaxed">
					Los valores por defecto usan tasas de referencia del Fondo Nacional
					del Ahorro (FNA). Como regla general el financiamiento llega hasta el
					70% del valor del inmueble en vivienda no VIS y hasta el 80% en VIS;
					algunas entidades como el FNA financian porcentajes mayores según tu
					vinculación.
				</p>

				<h2 className="mt-12 font-display text-2xl font-semibold text-white">
					Preguntas frecuentes
				</h2>
				<dl className="mt-4 mb-4">
					{FAQ.map(({ q, a, sources }) => (
						<div
							key={q}
							className="border-b border-white/10 py-5 last:border-b-0"
						>
							<dt className="font-medium text-white">{q}</dt>
							<dd className="mt-2 text-sm leading-relaxed text-gray-400">
								{a}
								{sources && (
									<ul className="mt-2 space-y-1 text-[11px] text-gray-500">
										{sources.map((s) => (
											<li key={s.url}>
												Fuente:{" "}
												<a
													href={s.url}
													target="_blank"
													rel="noopener noreferrer"
													className="underline decoration-white/20 transition-colors hover:text-palette-lime"
												>
													{s.label}
												</a>
											</li>
										))}
									</ul>
								)}
							</dd>
						</div>
					))}
				</dl>
			</section>
		</>
	);
}

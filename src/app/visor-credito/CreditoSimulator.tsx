"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Calculator, FileDown, Landmark } from "lucide-react";
import {
	DestinoAbono,
	FilaPesos,
	FilaUVR,
	Resumen,
	SistemaAmortizacion,
	Simulacion,
	TipoAporte,
	compararPesos,
	compararUVR,
} from "@/lib/credito";
import AmortChart from "./AmortChart";
import {
	PESOS_DEFAULTS,
	PESOS_FIELDS,
	TIPS,
	UVR_DEFAULTS,
	UVR_FIELDS,
	cop,
	fmt,
} from "./data";
import { descargarPesos, descargarUVR, pesosParamsFrom, uvrParamsFrom } from "./logic";
import { Button } from "@/components/ui/button";
import {
	COLS_PESOS,
	COLS_UVR,
	ComparativaAbonos,
	FormFields,
	Resultados,
	Stat,
} from "./ui";

type Comp = {
	resumenes: { sinAbono: Resumen; plazo: Resumen; cuota: Resumen };
	aporte: number;
	destino: DestinoAbono;
	tipo: TipoAporte;
	mesAbono: number;
	sistema: SistemaAmortizacion;
};

export default function CreditoSimulator() {
	const [tab, setTab] = useState<"UVR" | "Pesos">("UVR");
	const [uvrValues, setUvrValues] = useState(UVR_DEFAULTS);
	const [pesosValues, setPesosValues] = useState(PESOS_DEFAULTS);
	const [uvrResult, setUvrResult] = useState<Simulacion<FilaUVR> | null>(null);
	const [pesosResult, setPesosResult] = useState<Simulacion<FilaPesos> | null>(null);
	const [uvrComp, setUvrComp] = useState<Comp | null>(null);
	const [pesosComp, setPesosComp] = useState<Comp | null>(null);
	const [error, setError] = useState<string | null>(null);

	const calcular = () => {
		setError(null);
		try {
			if (tab === "UVR") {
				const params = uvrParamsFrom(uvrValues);
				const c = compararUVR(params);
				setUvrResult(params.destinoAbono === "cuota" ? c.cuota : c.plazo);
				setUvrComp({
					resumenes: {
						sinAbono: c.sinAbono.resumen,
						plazo: c.plazo.resumen,
						cuota: c.cuota.resumen,
					},
					aporte: params.aporteExtra,
					destino: params.destinoAbono ?? "plazo",
					tipo: params.tipoAporte ?? "unico",
					mesAbono: params.mesAbono ?? 1,
					sistema: params.sistema,
				});
			} else {
				const params = pesosParamsFrom(pesosValues);
				const c = compararPesos(params);
				setPesosResult(params.destinoAbono === "cuota" ? c.cuota : c.plazo);
				setPesosComp({
					resumenes: {
						sinAbono: c.sinAbono.resumen,
						plazo: c.plazo.resumen,
						cuota: c.cuota.resumen,
					},
					aporte: params.aporteExtra,
					destino: params.destinoAbono ?? "plazo",
					tipo: params.tipoAporte ?? "unico",
					mesAbono: params.mesAbono ?? 1,
					sistema: params.sistema,
				});
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		}
	};

	const r = tab === "UVR" ? uvrResult : pesosResult;
	const comp = tab === "UVR" ? uvrComp : pesosComp;
	const fin = r
		? `Mes ${r.resumen.finCreditoMes} (${Math.floor(r.resumen.finCreditoMes / 12)}a ${r.resumen.finCreditoMes % 12}m)`
		: "";

	return (
		<div className="flex min-h-screen flex-col px-4 text-white md:px-6">
			<div className="flex flex-1 flex-col gap-4 pt-4 lg:h-screen lg:min-h-0 lg:flex-none lg:pb-24">
				<header className="shrink-0">
					<h1 className="text-3xl font-semibold tracking-[-0.02em]">
						Visor de Crédito Hipotecario Colombia
					</h1>
					<p className="mt-2 text-sm text-gray-400">
						Proyección de amortización, seguros y abonos a capital · Ley
						546/1999 · Tasas referencia FNA
					</p>
				</header>

				{/* Inputs a la izquierda (sticky, con tabs dentro) · chart + tabla a la derecha */}
				<div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
					<aside className="lg:flex lg:flex-col lg:min-h-0 lg:overflow-y-auto rounded-lg border border-white/10 bg-palette-card/50 p-5">
						{/* Tabs dentro de la tarjeta de inputs */}
						<div className="mb-5 flex gap-4 border-b border-white/10">
							{(["UVR", "Pesos"] as const).map((t) => (
								<button
									key={t}
									onClick={() => {
										setTab(t);
										setError(null);
									}}
									className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
										tab === t
											? "border-palette-lime text-white"
											: "border-transparent text-gray-400 hover:text-white"
									}`}
								>
									{t === "UVR" ? (
										<Landmark size={15} className="shrink-0" />
									) : (
										<Banknote size={15} className="shrink-0" />
									)}
									{t}
								</button>
							))}
						</div>

						<div className="lg:flex-1">
							<FormFields
								fields={tab === "UVR" ? UVR_FIELDS : PESOS_FIELDS}
								values={tab === "UVR" ? uvrValues : pesosValues}
								onChangeAction={(id, v) =>
									(tab === "UVR" ? setUvrValues : setPesosValues)((prev) => ({
										...prev,
										[id]: v,
									}))
								}
							/>
						</div>

						<div className="mt-5 flex gap-2 *:flex-1">
							<Button
								variant="green"
								onClick={calcular}
								className="justify-center"
							>
								<Calculator size={16} />
								Calcular
							</Button>
							{r && (
								<button
									onClick={() => {
										if (tab === "UVR" && uvrResult) descargarUVR(uvrResult);
										else if (pesosResult) descargarPesos(pesosResult);
									}}
									className="flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-white/40"
								>
									<FileDown size={16} />
									Descargar CSV
								</button>
							)}
						</div>

						{error && (
							<p className="mt-4 rounded-md border border-palette-pink/40 bg-palette-pink/10 px-4 py-3 text-sm text-palette-pink">
								{error}
							</p>
						)}
					</aside>

					<section className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto">
						{!r ? (
							<div className="flex min-h-[200px] md:min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-gray-500">
								Configura los parámetros y presiona “Calcular Proyección”.
							</div>
						) : (
							<>
								{/* Stats compactos */}
								<div className="shrink-0 grid grid-cols-2 gap-2 lg:grid-cols-7">
									<Stat
										label="Monto a Financiar"
										value={fmt(r.resumen.montoCOP)}
										sub={
											tab === "UVR" && uvrResult
												? `${cop.format(Math.round(uvrResult.resumen.montoUVR ?? 0))} UVR`
												: undefined
										}
										accent="border-l-palette-pink"
									/>
									<Stat
										label="Tasa Efectiva Aplicada"
										value={`${r.resumen.tasaEA.toFixed(2)}% EA`}
									/>
									<Stat label="Cuota Mes 1" value={fmt(r.resumen.cuota1)} />
									<Stat
										label="Cuota Año 5"
										value={
											r.resumen.cuotaAnio5 !== null
												? fmt(r.resumen.cuotaAnio5)
												: r.resumen.cuotaAnio5Nota
										}
									/>
									<Stat label="Cuota Final" value={fmt(r.resumen.cuotaFinal)} />
									<Stat
										label="Fin del Crédito"
										value={fin}
										sub={r.resumen.finNota}
										accent="border-l-palette-olive"
									/>
									<Stat
										label="Total Pagado"
										value={fmt(r.resumen.totalPagado)}
										sub={`Incluye ${fmt(r.resumen.interesAcum)} de intereses`}
										accent="border-l-palette-lime"
										tip={tab === "UVR" ? TIPS.totalPagado : TIPS.totalPagadoPesos}
										tipPlacement="bottom"
									/>
								</div>

								{comp && comp.aporte > 0 && (
									<ComparativaAbonos
										resumenes={comp.resumenes}
										destino={comp.destino}
										tipo={comp.tipo}
										aporte={comp.aporte}
										mesAbono={comp.mesAbono}
										esCuotaConstante={comp.sistema === "cuotaConstante"}
									/>
								)}

								{/* Chart: ocupa el alto restante de la columna */}
								<div className="flex min-h-[220px] flex-1 flex-col rounded-lg border border-white/10 bg-white/[0.03] p-3">
									<div className="mb-1 flex shrink-0 justify-end">
										<a
											href="#tabla-amortizacion"
											className="text-[11px] text-gray-400 underline decoration-white/20 transition-colors hover:text-palette-lime"
										>
											Ver tabla de amortización ↓
										</a>
									</div>
									<AmortChart data={r.chart} />
								</div>
							</>
						)}
					</section>
				</div>
			</div>

			{r && (
				<section
					id="tabla-amortizacion"
					className="mt-6 shrink-0 scroll-mt-4"
				>
					<div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
							Tabla de amortización
						</h2>
						<p className="text-[11px] text-gray-500">
							{r.filas.length} meses ·{" "}
							{tab === "UVR" ? "línea UVR" : "línea pesos"}
						</p>
					</div>
					<div className="h-[440px]">
						{tab === "UVR" && uvrResult ? (
							<Resultados filas={uvrResult.filas} cols={COLS_UVR} />
						) : (
							pesosResult && (
								<Resultados filas={pesosResult.filas} cols={COLS_PESOS} />
							)
						)}
					</div>
				</section>
			)}

			<footer className="mt-8 shrink-0 pb-24 text-center text-xs text-gray-600">
				Simulación informativa · No constituye cotización formal · Verifique tasas
				y seguros con su entidad financiera ·{" "}
				<Link
					href="/terminos"
					className="underline decoration-white/20 transition-colors hover:text-palette-lime"
				>
					Términos
				</Link>
			</footer>
		</div>
	);
}

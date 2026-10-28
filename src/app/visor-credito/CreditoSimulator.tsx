"use client";

import { useReducer } from "react";
import Link from "next/link";
import { Banknote, Calculator, FileDown, Landmark } from "lucide-react";
import {
	BaseParams,
	Comparativa,
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

type Tab = "UVR" | "Pesos";

/** Resultado de una pestaña: la simulación visible y su comparativa de abonos. */
type Sim<F> = {
	result: Simulacion<F> | null;
	comp: Comp | null;
};

type State = {
	tab: Tab;
	values: Record<Tab, Record<string, string>>;
	sims: { UVR: Sim<FilaUVR>; Pesos: Sim<FilaPesos> };
	error: string | null;
};

type Action =
	| { type: "tab/changed"; tab: Tab }
	| { type: "field/changed"; id: string; value: string }
	| { type: "uvr/calculated"; result: Simulacion<FilaUVR>; comp: Comp }
	| { type: "pesos/calculated"; result: Simulacion<FilaPesos>; comp: Comp }
	| { type: "simulation/failed"; message: string };

function emptySim<F>(): Sim<F> {
	return { result: null, comp: null };
}

const INITIAL_STATE: State = {
	tab: "UVR",
	values: { UVR: UVR_DEFAULTS, Pesos: PESOS_DEFAULTS },
	sims: { UVR: emptySim<FilaUVR>(), Pesos: emptySim<FilaPesos>() },
	error: null,
};

/**
 * Todo lo que la pantalla muestra a la vez vive en un solo estado. Calcular
 * produce resultado + comparativa + error en una transición: antes eran tres
 * `setState` y un render intermedio podía pintar la comparativa nueva con el
 * resultado viejo. Cambiar de pestaña tampoco pierde la simulación de la otra.
 */
function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "tab/changed":
			return state.tab === action.tab && state.error === null
				? state
				: { ...state, tab: action.tab, error: null };
		case "field/changed":
			return {
				...state,
				values: {
					...state.values,
					[state.tab]: {
						...state.values[state.tab],
						[action.id]: action.value,
					},
				},
			};
		case "uvr/calculated":
			return {
				...state,
				sims: { ...state.sims, UVR: { result: action.result, comp: action.comp } },
				error: null,
			};
		case "pesos/calculated":
			return {
				...state,
				sims: { ...state.sims, Pesos: { result: action.result, comp: action.comp } },
				error: null,
			};
		case "simulation/failed":
			return { ...state, error: action.message };
	}
}

/** Arma el resultado visible y la comparativa a partir de una corrida completa. */
function simulated<P extends BaseParams, F>(
	params: P,
	c: Comparativa<F>,
): { result: Simulacion<F>; comp: Comp } {
	return {
		result: params.destinoAbono === "cuota" ? c.cuota : c.plazo,
		comp: {
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
		},
	};
}

export default function CreditoSimulator() {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	const { tab } = state;

	const calcular = () => {
		try {
			if (state.tab === "UVR") {
				const params = uvrParamsFrom(state.values.UVR);
				const { result, comp } = simulated(params, compararUVR(params));
				dispatch({ type: "uvr/calculated", result, comp });
			} else {
				const params = pesosParamsFrom(state.values.Pesos);
				const { result, comp } = simulated(params, compararPesos(params));
				dispatch({ type: "pesos/calculated", result, comp });
			}
		} catch (e) {
			dispatch({
				type: "simulation/failed",
				message: e instanceof Error ? e.message : "Error inesperado",
			});
		}
	};

	const active = state.sims[state.tab];
	const r = active.result;
	const comp = active.comp;
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
									onClick={() => dispatch({ type: "tab/changed", tab: t })}
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
								values={state.values[tab]}
								onChangeAction={(id, value) =>
									dispatch({ type: "field/changed", id, value })
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
										if (tab === "UVR" && state.sims.UVR.result)
											descargarUVR(state.sims.UVR.result);
										else if (state.sims.Pesos.result)
											descargarPesos(state.sims.Pesos.result);
									}}
									className="flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-white/40"
								>
									<FileDown size={16} />
									Descargar CSV
								</button>
							)}
						</div>

						{state.error && (
							<p className="mt-4 rounded-md border border-palette-pink/40 bg-palette-pink/10 px-4 py-3 text-sm text-palette-pink">
								{state.error}
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
											tab === "UVR" && state.sims.UVR.result
												? `${cop.format(Math.round(state.sims.UVR.result.resumen.montoUVR ?? 0))} UVR`
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
						{tab === "UVR" && state.sims.UVR.result ? (
							<Resultados filas={state.sims.UVR.result.filas} cols={COLS_UVR} />
						) : (
							state.sims.Pesos.result && (
								<Resultados filas={state.sims.Pesos.result.filas} cols={COLS_PESOS} />
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

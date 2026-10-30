"use client";

// Piezas presentacionales del visor: tooltip, tarjetas de stat, formulario y
// tabla de amortización. Sin lógica de negocio ni chart.js.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import {
	BaseParams,
	DestinoAbono,
	eaDesdeNamv,
	FilaPesos,
	FilaUVR,
	namvDesdeEa,
	Resumen,
	TipoAporte,
} from "@/lib/credito";
import { Field, MONO, TIPS, fmt } from "./data";

// Parámetros tal como se usaron en la última simulación. La tira de supuestos
// lee de aquí, no del formulario: así los números y sus premisas coinciden
// aunque el usuario ya haya editado un campo.
export type ParamsSnap = BaseParams & {
	valorUVR?: number;
	inflacionEA?: number;
};

// Popover position:fixed para escapar del clip de los contenedores con scroll.
// placement decide si el popover va por encima ("top") o por debajo ("bottom").
// Se abre con hover, con foco de teclado y con tap: buena parte de la
// explicación del visor vive aquí, así que no puede depender del mouse.
export function Tip({
	text,
	placement = "top",
}: {
	text: string;
	placement?: "top" | "bottom";
}) {
	const ref = useRef<HTMLButtonElement>(null);
	const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

	const abrir = () => {
		const r = ref.current?.getBoundingClientRect();
		if (!r) return;
		setPos({
			left: Math.max(
				8,
				Math.min(r.left + r.width / 2 - 125, window.innerWidth - 258),
			),
			top: placement === "bottom" ? r.bottom + 8 : r.top - 8,
		});
	};

	// Un tap fuera del icono cierra el popover en pantallas táctiles.
	useEffect(() => {
		if (!pos) return;
		const fuera = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) setPos(null);
		};
		document.addEventListener("pointerdown", fuera);
		return () => document.removeEventListener("pointerdown", fuera);
	}, [pos]);

	return (
		<>
			<button
				ref={ref}
				type="button"
				aria-label="Más información"
				aria-expanded={pos !== null}
				className="ml-1.5 inline-flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full bg-palette-lime align-[1px] text-[10px] font-bold leading-none text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-lime focus-visible:ring-offset-2 focus-visible:ring-offset-palette-card"
				onMouseEnter={abrir}
				onMouseLeave={() => setPos(null)}
				onFocus={abrir}
				onBlur={() => setPos(null)}
				onPointerUp={(e) => {
					if (e.pointerType === "mouse") return;
					if (pos) setPos(null);
					else abrir();
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						setPos(null);
						ref.current?.blur();
					}
				}}
			>
				i
			</button>
			{pos &&
				createPortal(
					<div
						role="tooltip"
						style={{
							position: "fixed",
							left: pos.left,
							top: pos.top,
							width: 250,
							transform: placement === "bottom" ? undefined : "translateY(-100%)",
						}}
						className="z-modal rounded-md border border-white/10 bg-palette-alt px-2.5 py-1.5 text-xs leading-relaxed text-gray-200 shadow-xl"
					>
						{text}
					</div>,
					document.body,
				)}
		</>
	);
}

// Stat compacto: valor en una línea, sub opcional, acento por borde izquierdo.
export function Stat({
	label,
	value,
	sub,
	accent = "border-l-white/20",
	tip,
	tipPlacement,
}: {
	label: string;
	value: string;
	sub?: string;
	accent?: string;
	tip?: string;
	tipPlacement?: "top" | "bottom";
}) {
	return (
		<div
			className={`rounded-md border border-white/10 border-l-[3px] bg-palette-card/60 px-3 py-2 ${accent}`}
		>
			<span className="block text-[10px] font-medium uppercase tracking-wider text-gray-500">
				{label}
				{tip && <Tip text={tip} placement={tipPlacement} />}
			</span>
			<span
				className={`mt-0.5 block truncate text-sm font-semibold text-white ${MONO}`}
			>
				{value}
			</span>
			{sub && (
				<span className="block truncate text-[10px] text-gray-500">{sub}</span>
			)}
		</div>
	);
}

// Etiquetas legibles para el sistema de amortización.
const SISTEMA_LABEL: Record<string, string> = {
	cuotaConstante: "Cuota constante",
	abonoConstante: "Abono constante",
};

/**
 * Tira de supuestos de la corrida visible. Lee del snapshot, así que sigue
 * siendo cierta aunque el formulario ya tenga otros valores.
 */
export function Supuestos({ tab, snap }: { tab: "UVR" | "Pesos"; snap: ParamsSnap }) {
	const tasaEA = Math.max(0, snap.tasaBaseEA - (snap.descuentoTasa || 0));
	const items: { k: string; v: string; tip?: string }[] = [
		{
			k: "Tasa",
			v:
				snap.descuentoTasa > 0
					? `${snap.tasaBaseEA.toFixed(2)}% − ${snap.descuentoTasa.toFixed(2)}% = ${tasaEA.toFixed(2)}% E.A.`
					: `${tasaEA.toFixed(2)}% E.A.`,
			tip: "Tasa efectiva anual. El motor la convierte a mensual con interés compuesto: (1 + E.A.)^(1/12) − 1.",
		},
		{
			k: "Plazo",
			v: `${snap.plazoAnios} años · ${snap.porcentajeCredito}% financiado`,
		},
		{ k: "Sistema", v: SISTEMA_LABEL[snap.sistema] ?? snap.sistema },
	];

	if (tab === "UVR") {
		items.push(
			{
				k: "Inflación",
				v: `${(snap.inflacionEA ?? 0).toFixed(1)}% E.A.`,
				tip: "Supuesto de inflación (IPC) para toda la vida del crédito. Es un escenario, no un pronóstico: la UVR real se certifica cada mes.",
			},
			{ k: "UVR inicial", v: fmt(snap.valorUVR ?? 0) },
		);
	}

	items.push(
		{
			k: "Seguros",
			v: `vida ${snap.seguroVidaPct}% · hogar ${snap.seguroHogarPct}%`,
		},
		{
			k: "Prepago",
			v:
				snap.aporteExtra > 0
					? `${fmt(snap.aporteExtra)} ${
							(snap.tipoAporte ?? "unico") === "mensual"
								? "mensual"
								: `en el mes ${snap.mesAbono ?? 1}`
						} · ${(snap.destinoAbono ?? "plazo") === "cuota" ? "baja cuota" : "baja plazo"}`
					: "Ninguno",
		},
	);

	return (
		<div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
			<div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
				<h2 className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
					Supuestos de esta simulación
				</h2>
				<span className="text-[10px] text-gray-600">Se fijan al calcular</span>
			</div>
			<dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
				{items.map((item) => (
					<div key={item.k} className="flex items-baseline gap-1.5">
						<dt className="text-gray-500">{item.k}</dt>
						<dd className="text-gray-300">
							{item.v}
							{item.tip && <Tip text={item.tip} />}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

/**
 * En UVR la cuota pactada en UVR no cambia, pero la de pesos sí. La frase usa
 * la corrida SIN prepagos para que el crecimiento sea el de la inflación y no
 * el efecto de un abono.
 */
export function CrecimientoUVR({ base }: { base: Resumen }) {
	const pct = base.cuota1 > 0 ? (base.cuotaFinal / base.cuota1 - 1) * 100 : 0;

	return (
		<div className="shrink-0 rounded-lg border border-palette-lime/25 bg-palette-lime/[0.06] px-3 py-2 text-[11px] leading-relaxed text-gray-300">
			<span className="font-semibold text-palette-lime">
				La cuota en UVR es fija, pero en pesos crece con la inflación.
			</span>{" "}
			Con estos supuestos pagas{" "}
			<strong className="text-white">{fmt(base.cuota1)}</strong> el mes 1
			{base.cuotaAnio5 !== null && (
				<>
					{" → "}
					<strong className="text-white">{fmt(base.cuotaAnio5)}</strong> en el
					año 5
				</>
			)}
			{" → "}
			<strong className="text-white">{fmt(base.cuotaFinal)}</strong> en la
			última cuota
			{pct > 0.5 && (
				<>
					{" "}
					(<span className="font-semibold text-palette-pink">
						+{Math.round(pct)}%
					</span>{" "}
					por inflación)
				</>
			)}
			.
		</div>
	);
}

/**
 * Sensibilidad a la inflación: la cuota en UVR no cambia, la de pesos sí. Tres
 * escenarios con los mismos parámetros de la corrida, para que el supuesto deje
 * de ser invisible.
 */
export function SensibilidadInflacion({
	rows,
	actual,
}: {
	rows: { inflacion: number; cuotaAnio5: number | null; totalPagado: number }[];
	actual: number;
}) {
	return (
		<div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
			<div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
				<h2 className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
					Si la inflación fuera otra
				</h2>
				<span className="text-[10px] text-gray-600">
					Mismos parámetros · solo cambia el IPC anual
				</span>
			</div>
			<table className="w-full text-[11px]">
				<thead>
					<tr className="text-left text-gray-500">
						<th className="pb-1 font-medium">Inflación</th>
						<th className="pb-1 text-right font-medium">Cuota año 5</th>
						<th className="pb-1 text-right font-medium">Total pagado</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => {
						const esActual = Math.abs(row.inflacion - actual) < 0.05;
						return (
							<tr
								key={row.inflacion}
								className={esActual ? "text-palette-lime" : "text-gray-300"}
							>
								<td className={`py-0.5 ${MONO}`}>
									{row.inflacion.toFixed(1)}%{esActual && " ★"}
								</td>
								<td className={`py-0.5 text-right ${MONO}`}>
									{row.cuotaAnio5 !== null ? fmt(row.cuotaAnio5) : "—"}
								</td>
								<td className={`py-0.5 text-right ${MONO}`}>
									{fmt(row.totalPagado)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

/** Composición de totalPagado: capital + intereses + seguros + ajuste UVR. */export function DesgloseTotal({
	resumen,
	tab,
}: {
	resumen: Resumen;
	tab: "UVR" | "Pesos";
}) {
	const tieneUVR = tab === "UVR" && resumen.ajusteUVR > 1;
	const items = [
		{
			key: "capital",
			label: "Capital",
			value: resumen.montoCOP,
			cls: "bg-palette-lime",
		},
		{
			key: "interes",
			label: "Intereses",
			value: resumen.interesAcum,
			cls: "bg-palette-pink",
		},
		{
			key: "seguros",
			label: "Seguros",
			value: resumen.segurosAcum,
			cls: "bg-gray-400",
		},
		...(tieneUVR
			? [
					{
						key: "uvr",
						label: "Ajuste UVR",
						value: resumen.ajusteUVR,
						cls: "bg-palette-olive",
					},
				]
			: []),
	];
	const total = resumen.totalPagado;

	return (
		<div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
			<div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
				<h2 className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
					¿En qué se fue el total pagado?
				</h2>
				<span className="text-[11px] text-gray-400">
					Total{" "}
					<strong className={`text-white ${MONO}`}>{fmt(total)}</strong>
				</span>
			</div>
			<div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
				{items.map((item) => (
					<span
						key={item.key}
						className={item.cls}
						style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
						title={`${item.label}: ${fmt(item.value)}`}
					/>
				))}
			</div>
			<dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
				{items.map((item) => (
					<div
						key={item.key}
						className="flex items-baseline justify-between gap-2"
					>
						<dt className="flex items-center gap-1.5 text-gray-500">
							<span className={`h-2 w-2 shrink-0 rounded-full ${item.cls}`} />
							{item.label}
						</dt>
						<dd className={`text-right text-gray-300 ${MONO}`}>
							{fmt(item.value)}
						</dd>
					</div>
				))}
			</dl>
			{tieneUVR && (
				<p className="mt-1.5 text-[10px] leading-snug text-gray-500">
					El ajuste UVR es lo que suma el capital por la indexación: pagas en
					pesos la UVR de cada mes, no la del día en que firmaste.
				</p>
			)}
		</div>
	);
}

export function FormFields({
	fields,
	values,
	onChangeAction,
}: {
	fields: Field[];
	values: Record<string, string>;
	onChangeAction: (id: string, v: string) => void;
}) {
	const visibles = fields.filter((f) => !f.showIf || f.showIf(values));
	return (
		<div className="grid grid-cols-1 gap-4 gap-x-4 sm:grid-cols-2">
			{visibles.map((f, i) => {
				const live = f.live?.(values) ?? null;
				return (
					<div
						key={f.id}
						className={
							f.cards ||
							(visibles.length % 2 === 1 && i === visibles.length - 1)
								? "sm:col-span-2"
								: ""
						}
					>
						<div className="mb-1.5 flex items-baseline justify-between gap-2">
							{f.cards ? (
								<span className="block text-xs font-medium tracking-wide text-gray-400">
									{f.label}
								</span>
							) : (
								<label
									className="block text-xs font-medium tracking-wide text-gray-400"
									htmlFor={f.id}
								>
									{f.label}
								</label>
							)}
						</div>
						{f.options && f.cards ? (
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{f.options.map((o) => {
									const activo = values[f.id] === o.value;
									return (
										<button
											key={o.value}
											type="button"
											aria-pressed={activo}
											onClick={() => onChangeAction(f.id, o.value)}
											className={`rounded-md border px-3 py-2 text-left transition-colors ${
												activo
													? "border-palette-lime/60 bg-palette-lime/[0.08]"
													: "border-white/10 bg-palette-card hover:border-white/25"
											}`}
										>
											<span
												className={`block text-xs font-semibold ${
													activo ? "text-palette-lime" : "text-white"
												}`}
											>
												{o.label}
											</span>
											{o.desc && (
												<span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
													{o.desc}
												</span>
											)}
										</button>
									);
								})}
							</div>
						) : f.options ? (
							<select
								id={f.id}
								className={`w-full rounded-md border border-white/10 bg-palette-card px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-palette-lime ${MONO}`}
								value={values[f.id]}
								onChange={(e) => onChangeAction(f.id, e.target.value)}
							>
								{f.options.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						) : (
							<div className="relative">
								<Input
									type="number"
									id={f.id}
									step={f.step}
									min={f.min}
									className={`hide-spinners h-10 w-full border-white/10 bg-palette-card text-sm text-white focus-visible:ring-palette-lime ${MONO} ${
										f.segmented ? "pr-[74px]" : ""
									}`}
									value={values[f.id]}
									onChange={(e) => onChangeAction(f.id, e.target.value)}
								/>
								{f.segmented && (
									<div
										role="group"
										aria-label="Unidad de la tasa"
										className="absolute right-1 top-1/2 flex -translate-y-1/2 overflow-hidden rounded border border-white/15 bg-palette-alt"
									>
										{f.segmented.options.map((o) => {
											const activo =
												(values[f.segmented!.id] ?? "ea") === o.value;
											return (
												<button
													key={o.value}
													type="button"
													aria-pressed={activo}
													onClick={() => {
														const segId = f.segmented!.id;
														const actual = values[segId] ?? "ea";
														if (actual === o.value) return;
														// Cambiar de unidad no debe cambiar el costo del
														// crédito: se convierte el número mostrado.
														const crudo = parseFloat(values[f.id]);
														if (Number.isFinite(crudo) && crudo > 0) {
															const ea =
																actual === "namv"
																	? eaDesdeNamv(crudo)
																	: crudo;
															const nuevo =
																o.value === "namv" ? namvDesdeEa(ea) : ea;
															onChangeAction(
																f.id,
																String(Number(nuevo.toFixed(4))),
															);
														}
														onChangeAction(segId, o.value);
													}}
													className={`px-1.5 py-1 text-[10px] font-semibold transition-colors ${
														activo
															? "bg-palette-lime text-gray-900"
															: "bg-transparent text-gray-400 hover:text-white"
													}`}
												>
													{o.label}
												</button>
											);
										})}
									</div>
								)}
							</div>
						)}
						{f.presets && (
							<div className="mt-1.5 flex gap-1">
								{f.presets.map((p) => {
									const activo = values[f.id] === p.value;
									return (
										<button
											key={p.value}
											type="button"
											aria-pressed={activo}
											onClick={() => onChangeAction(f.id, p.value)}
											className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
												activo
													? "border-palette-lime/60 bg-palette-lime/15 text-palette-lime"
													: "border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
											}`}
										>
											{p.label}
										</button>
									);
								})}
							</div>
						)}
						{live && (
							<p className={`mt-1 text-[11px] leading-snug text-gray-400 ${MONO}`}>
								{live}
							</p>
						)}
						{f.note && (
							<p className="mt-1 text-[11px] leading-snug text-gray-500">
								{f.note}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}

export type Col<F> = {
	h: string;
	tip?: string;
	num?: boolean; // alineación derecha (números)
	mo?: boolean; // visible en móvil; el resto se oculta bajo el breakpoint sm
	cell: (f: F) => string;
};

export const COLS_UVR: Col<FilaUVR>[] = [
	{ h: "Mes", mo: true, cell: (f) => String(f.mes) },
	{ h: "Valor UVR", tip: TIPS.uvr, num: true, cell: (f) => f.uvr.toFixed(2) },
	{ h: "Cuota (UVR)", tip: "Cuota exigida en UVR. Constante en 'Cuota Constante', salvo que el prepago se destine a reducir cuota.", num: true, cell: (f) => f.cuotaUVR.toFixed(2) },
	{ h: "Interés (UVR)", tip: TIPS.interesUVR, num: true, cell: (f) => f.interesUVR.toFixed(2) },
	{ h: "Capital (UVR)", tip: TIPS.capital, num: true, cell: (f) => f.abonoCapitalUVR.toFixed(2) },
	{ h: "Saldo (UVR)", tip: TIPS.saldoUVR, num: true, cell: (f) => f.saldoUVR.toFixed(2) },
	{ h: "Prepago (COP)", tip: TIPS.prepago, num: true, mo: true, cell: (f) => fmt(f.aporteExtraCOP) },
	{ h: "Seguros (COP)", tip: TIPS.seguros, num: true, cell: (f) => fmt(f.segurosCOP) },
	{ h: "Cuota Total", tip: TIPS.cuotaTotal, num: true, mo: true, cell: (f) => fmt(f.cuotaTotalCOP) },
	{ h: "Saldo (COP)", tip: TIPS.saldoCOP, num: true, cell: (f) => fmt(f.saldoCOP) },
];

export const COLS_PESOS: Col<FilaPesos>[] = [
	{ h: "Mes", mo: true, cell: (f) => String(f.mes) },
	{
		h: "Cuota (COP)",
		tip: "Cuota exigida (sistema francés). Constante todo el crédito, salvo que el prepago se destine a reducir cuota.",
		num: true,
		cell: (f) => fmt(f.cuota),
	},
	{
		h: "Interés (COP)",
		tip: "Saldo × tasa mensual. Solo la deuda genera interés; los seguros no. Al inicio es lo mayor de la cuota.",
		num: true,
		cell: (f) => fmt(f.interes),
	},
	{ h: "Capital (COP)", tip: TIPS.capital, num: true, cell: (f) => fmt(f.abonoCapital) },
	{
		h: "Saldo (COP)",
		tip: "Deuda pendiente tras el pago del mes: saldo anterior − capital − prepago. Base del interés del mes siguiente.",
		num: true,
		cell: (f) => fmt(f.saldo),
	},
	{ h: "Prepago (COP)", tip: TIPS.prepago, num: true, mo: true, cell: (f) => fmt(f.aporteExtraCOP) },
	{ h: "Seguros (COP)", tip: TIPS.seguros, num: true, cell: (f) => fmt(f.segurosCOP) },
	{
		h: "Cuota Total",
		tip: "Lo que pagas este mes: cuota + prepago + seguros. Suma el 'Total Pagado' del resumen.",
		num: true,
		mo: true,
		cell: (f) => fmt(f.cuotaTotalCOP),
	},
];

const finTexto = (mes: number) => `${Math.floor(mes / 12)}a ${mes % 12}m`;

// Comparativa siempre visible: el aporte se corre en las dos variantes para
// mostrar el trade-off entre ahorro de intereses y alivio de caja.
export function ComparativaAbonos({
	resumenes,
	destino,
	tipo,
	aporte,
	mesAbono,
	esCuotaConstante,
}: {
	resumenes: { sinAbono: Resumen; plazo: Resumen; cuota: Resumen };
	destino: DestinoAbono;
	tipo: TipoAporte;
	aporte: number;
	mesAbono: number;
	esCuotaConstante: boolean;
}) {
	const base = resumenes.sinAbono;
	const items = [
		{
			key: "plazo" as const,
			titulo: "Reducir plazo",
			desc: "Misma cuota, menos meses",
			r: resumenes.plazo,
		},
		{
			key: "cuota" as const,
			titulo: "Reducir cuota",
			desc: "Mismo plazo, cuota más baja",
			r: resumenes.cuota,
		},
	];

	return (
		<div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-3">
			<div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
					Efecto del prepago de {fmt(aporte)}
					{tipo === "unico" ? ` en el mes ${mesAbono}` : " cada mes"}
				</h2>
				<p className="text-[11px] text-gray-500">
					Sin prepago: intereses {fmt(base.interesAcum)} · fin{" "}
					{finTexto(base.finCreditoMes)}
				</p>
			</div>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				{items.map(({ key, titulo, desc, r }) => {
					const elegido = destino === key;
					const ahorro = Math.max(0, base.interesAcum - r.interesAcum);
					const mesesMenos = base.finCreditoMes - r.finCreditoMes;
					const cuotaMenos = Math.max(
						0,
						base.cuotaExigidaFinal - r.cuotaExigidaFinal,
					);
					return (
						<div
							key={key}
							className={`rounded-md border px-3 py-2 ${
								elegido
									? "border-palette-lime/60 bg-palette-lime/[0.06]"
									: "border-white/10 bg-palette-card/40"
							}`}
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-semibold text-white">
									{titulo}
								</span>
								{elegido && (
									<span className="rounded bg-palette-lime px-1.5 py-0.5 text-[10px] font-bold text-gray-900">
										Elegido
									</span>
								)}
							</div>
							<span className="block text-[10px] text-gray-500">{desc}</span>
							<dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
								<dt className="text-gray-500">Cuota final (sin seguros)</dt>
								<dd className={`text-right text-white ${MONO}`}>
									{fmt(r.cuotaExigidaFinal)}
									{key === "cuota" &&
										esCuotaConstante &&
										r.reduccionCuotaPct > 0.005 && (
											<span className="ml-1 text-palette-lime">
												{" "}−{Math.round(r.reduccionCuotaPct * 100)}%
											</span>
										)}
								</dd>
								<dt className="text-gray-500">Fin del crédito</dt>
								<dd className={`text-right text-white ${MONO}`}>
									{finTexto(r.finCreditoMes)}
								</dd>
								<dt className="text-gray-500">Ahorro en intereses</dt>
								<dd className={`text-right text-palette-lime ${MONO}`}>
									{fmt(ahorro)}
								</dd>
								<dt className="text-gray-500">Total desembolsado</dt>
								<dd className={`text-right text-white ${MONO}`}>
									{fmt(r.totalPagado)}
								</dd>
							</dl>
							<p className="mt-1.5 border-t border-white/10 pt-1.5 text-[10px] leading-snug text-gray-400">
								<span className="text-gray-500">vs. sin prepago: </span>
								{mesesMenos > 0 ? `−${mesesMenos} meses` : "mismo plazo"}
								{" · "}
								{key === "cuota" && cuotaMenos > 0
									? `cuota final −${fmt(cuotaMenos)}`
									: "pago mensual igual"}
							</p>
						</div>
					);
				})}
			</div>
			{tipo === "mensual" && destino === "cuota" && (
				<p className="mt-2 text-[11px] leading-snug text-gray-500">
					Con prepagos mensuales la cuota exigida baja cada mes y el crédito
					también puede cerrarse antes: el ahorro depende de que mantengas el
					prepago.
				</p>
			)}
		</div>
	);
}

export function Resultados<F>({ filas, cols }: { filas: F[]; cols: Col<F>[] }) {
	return (
		<div className="h-full overflow-auto rounded-md border border-white/10">
			<table className="w-full border-collapse">
				<thead>
					<tr>
						{cols.map((c, i) => (
							<th
								key={c.h}
								className={`sticky top-0 z-[1] whitespace-nowrap border-b border-white/10 bg-palette-card px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-300 ${
									c.num ? "text-right" : "text-left"
								} ${i === 0 ? "pl-4" : ""} ${c.mo ? "" : "hidden sm:table-cell"}`}
							>
								{c.h}
								{c.tip && <Tip text={c.tip} />}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{filas.map((f, i) => (
						<tr key={i} className="transition-colors hover:bg-white/[0.04]">
							{cols.map((c, j) => (
								<td
									key={c.h}
									className={`px-2 py-1.5 whitespace-nowrap border-b border-white/5 text-[12px] [font-variant-numeric:tabular-nums] ${
										c.num
											? `text-right text-white ${MONO}`
											: "text-left text-gray-400"
									} ${j === 0 ? "pl-4" : ""} ${c.mo ? "" : "hidden sm:table-cell"}`}
								>
									{c.cell(f)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

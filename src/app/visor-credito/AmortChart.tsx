"use client";

import { useEffect, useRef } from "react";
import {
	CategoryScale,
	Chart,
	Filler,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
} from "chart.js";
import { Simulacion } from "@/lib/credito";
import { C_LIME, C_OLIVE, C_PINK } from "./data";

// El registro vive aquí para que importar la UI no arrastre chart.js.
Chart.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Filler,
	Tooltip,
	Title,
);

// Las fuentes del tool (next/font) viven en CSS vars del layout; el canvas no
// las hereda, se leen del elemento montado.
const cssFont = (el: HTMLElement, v: string) =>
	getComputedStyle(el).getPropertyValue(v) || "monospace";

// Leyenda propia: chips HTML en vez del plugin de chart.js, para que se lea
// igual en móvil (donde los ejes están ocultos) y quede accesible.
const SERIES = [
	{ label: "Cuota exigida + seguros", color: C_LIME },
	{ label: "Saldo de deuda", color: C_PINK },
	{ label: "Intereses acumulados", color: C_OLIVE, dashed: true },
];

export default function AmortChart({ data }: { data: Simulacion<unknown>["chart"] }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartRef = useRef<Chart<"line"> | null>(null);

	useEffect(() => {
		if (!canvasRef.current) return;
		const el = canvasRef.current;
		const mono = cssFont(el, "--font-credito-mono");
		const sans = cssFont(el, "--font-inter") || "sans-serif";
		// En móvil los ejes Y se comen el ancho: se ocultan y el tooltip da el valor.
		const mq = window.matchMedia("(min-width: 640px)");

		chartRef.current?.destroy();
		chartRef.current = new Chart(el, {
			type: "line",
			data: {
				labels: data.labels,
				datasets: [
					{
						label: "Cuota exigida + seguros (COP)",
						data: data.cuotas,
						borderColor: C_LIME,
						backgroundColor: "rgba(212, 255, 77, 0.12)",
						borderWidth: 2,
						// puntos siempre visibles: el usuario ve dónde hacer hover
						pointRadius: 3,
						pointHoverRadius: 6,
						pointHitRadius: 14,
						pointBackgroundColor: C_LIME,
						fill: true,
						tension: 0.3,
						yAxisID: "y",
					},
					{
						label: "Saldo de deuda (COP)",
						data: data.saldo,
						borderColor: C_PINK,
						borderWidth: 2,
						pointRadius: 0,
						pointHitRadius: 14,
						tension: 0.3,
						yAxisID: "y1",
					},
					{
						label: "Intereses acumulados (COP)",
						data: data.interesAcum,
						borderColor: C_OLIVE,
						borderWidth: 2,
						pointRadius: 0,
						pointHitRadius: 14,
						borderDash: [6, 4],
						tension: 0.3,
						yAxisID: "y1",
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				// hover perdonador: el tooltip aparece sin puntería exacta
				interaction: { mode: "nearest", axis: "x", intersect: false },
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) =>
								`${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString("es-CO")}`,
						},
					},
				},
				scales: {
					x: { ticks: { maxTicksLimit: 20, font: { family: mono, size: 10 } }, grid: { color: "#6f6f6f" }, },
					y: {
						display: mq.matches,
						position: "left",
						beginAtZero: false,
						grid: { color: "#6f6f6f" },
						title: { display: true, text: "Cuota exigida", font: { family: sans, size: 11 } },
						ticks: {
							maxTicksLimit: 15,
							font: { family: mono, size: 10 },
							callback: (v) => "$" + Number(v).toLocaleString("es-CO"),
						},
					},
					y1: {
						display: mq.matches,
						position: "right",
						beginAtZero: true,
						grid: { drawOnChartArea: false },
						title: {
							display: true,
							text: "Saldo / Intereses acumulados",
							font: { family: sans, size: 11 },
						},
						ticks: {
							maxTicksLimit: 15,
							font: { family: mono, size: 10 },
							callback: (v) => "$" + Number(v).toLocaleString("es-CO"),
						},
					},
				},
			},
		});

		// Los ejes siguen el breakpoint sm aunque se rote el dispositivo.
		const aplicarEjes = () => {
			const c = chartRef.current;
			if (!c) return;
			c.options.scales!.y!.display = mq.matches;
			c.options.scales!.y1!.display = mq.matches;
			c.update();
		};
		mq.addEventListener("change", aplicarEjes);

		return () => {
			mq.removeEventListener("change", aplicarEjes);
			chartRef.current?.destroy();
			chartRef.current = null;
		};
	}, [data]);

	return (
		<div className="flex min-h-[180px] flex-1 flex-col">
			<ul className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
				{SERIES.map((s) => (
					<li key={s.label} className="flex items-center gap-1.5">
						<span
							aria-hidden
							className={`h-0 w-4 border-t-2 ${
								s.dashed ? "border-dashed" : ""
							}`}
							style={{ borderColor: s.color }}
						/>
						{s.label}
					</li>
				))}
			</ul>
			<div className="relative min-h-[160px] flex-1">
				<canvas ref={canvasRef} />
			</div>
		</div>
	);
}

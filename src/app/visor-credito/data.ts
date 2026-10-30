// Configuración estática del visor de crédito: campos, defaults, tips y
// helpers de formato. Sin JSX ni estado.

import {
	eaDesdeNamv,
	mensualDesdeEa,
	namvDesdeEa,
} from "@/lib/credito";

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
export const cop = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

// Texto general hereda la sans del app (Inter); los números van en mono.
export const MONO = "[font-family:var(--font-credito-mono),monospace]";

export type Option = { value: string; label: string; desc?: string };
export type Field = {
	id: string;
	label: string;
	note?: string;
	options?: Option[];
	step?: string;
	min?: string;
	// Campo condicional: solo se muestra si el formulario cumple la condición.
	showIf?: (values: Record<string, string>) => boolean;
	// Selector segmentado incrustado en la etiqueta; guarda el valor en otro id.
	segmented?: { id: string; options: Option[] };
	// Atajos que escriben el valor del propio campo.
	presets?: Option[];
	// Línea calculada en vivo bajo el campo (equivalencias, etc.).
	live?: (values: Record<string, string>) => string | null;
	// Se pinta como dos tarjetas de opción en vez de un <select>.
	cards?: boolean;
};

/** Números de tasa con coma decimal y hasta 3 decimales. */
const num = (n: number) =>
	n.toLocaleString("es-CO", { maximumFractionDigits: 3 });

const unidadesTasa: Option[] = [
	{ value: "ea", label: "E.A." },
	{ value: "namv", label: "N.A.M.V." },
];

/**
 * El motor compone la E.A.; aquí se muestra la triple equivalencia para que
 * quien tenga una cotización en N.A.M.V. no la escriba como E.A. por error.
 */
export function equivalenciaTasa(
	raw: string,
	unidad: string | undefined,
): string | null {
	const valor = parseFloat(raw);
	if (!Number.isFinite(valor) || valor <= 0) return null;
	const ea = unidad === "namv" ? eaDesdeNamv(valor) : valor;
	// Atrapa el clásico 1,2 queriendo decir 12% y las tasas escritas en la
	// unidad equivocada, sin bloquear la simulación.
	const aviso = ea < 3 || ea > 30 ? " · valor inusual, revisa la unidad" : "";
	return `${num(ea)}% E.A. = ${num(namvDesdeEa(ea))}% N.A.M.V. = ${num(
		mensualDesdeEa(ea),
	)}% mensual${aviso}`;
}

const destinos: Option[] = [
	{
		value: "plazo",
		label: "Reducir plazo",
		desc: "Misma cuota, terminas antes",
	},
	{
		value: "cuota",
		label: "Reducir cuota",
		desc: "Mismo plazo, pagas menos",
	},
];
const frecuencias: Option[] = [
	{ value: "unico", label: "Único (un mes)" },
	{ value: "mensual", label: "Mensual (recurrente)" },
];

// Paleta del portafolio (tailwind.config.ts · theme.extend.colors.palette)
export const C_LIME = "#d4ff4d";
export const C_PINK = "#fb8983";
export const C_OLIVE = "#7d8300"; // línea punteada, oscurecida para que no compita con la lime

const siNo: Option[] = [
	{ value: "cuotaConstante", label: "Cuota Constante en UVR (creciente COP)" },
	{ value: "abonoConstante", label: "Abono Constante a Capital en UVR" },
];
const pct = (desde: number, hasta: number): Option[] => {
	const out: Option[] = [];
	for (let v = desde; v <= hasta; v += 10)
		out.push({ value: String(v), label: `${v}%` });
	return out;
};

export const UVR_FIELDS: Field[] = [
	{ id: "valorInmueble", label: "Valor del Inmueble (COP)", step: "1000000" },
	{
		id: "porcentajeCredito",
		label: "Porcentaje a Financiar",
		options: pct(50, 90),
	},
	{
		id: "plazoAnios",
		label: "Plazo del Crédito (Años)",
		options: [5, 10, 15, 20, 25, 30].map((a) => ({
			value: String(a),
			label: `${a} Años`,
		})),
	},
	{ id: "sistema", label: "Sistema de Amortización", options: siNo },
	{
		id: "valorUVR",
		label: "Valor actual de la UVR (COP)",
		step: "0.01",
		note: "Actualizable · UVR del día (Banco de la República)",
	},
	{
		id: "tasaBase",
		label: "Tasa Remuneratoria Base",
		step: "0.1",
		segmented: { id: "tasaUnidad", options: unidadesTasa },
		note: 'Tasa sobre UVR · ej FNA cotiza "UVR + 8,1%" E.A.',
		live: (v) => equivalenciaTasa(v.tasaBase, v.tasaUnidad),
	},
	{
		id: "descuentoTasa",
		label: "Descuento Programa (E.A)",
		step: "0.1",
		min: "0",
		note: "Ej: FRECH disminuye puntos EA",
	},
	{
		id: "inflacion",
		label: "Inflación esperada (IPC anual)",
		step: "0.1",
		presets: [
			{ value: "3", label: "3%" },
			{ value: "5", label: "5%" },
			{ value: "8", label: "8%" },
		],
		note: "Escenario, no pronóstico · la UVR real se certifica cada mes",
		live: (v) => {
			const valor = parseFloat(v.inflacion);
			if (!Number.isFinite(valor) || valor <= 0) return null;
			const mensual = mensualDesdeEa(valor);
			const aviso = valor < 2 || valor > 9 ? " · fuera de rango típico" : "";
			return `≈ ${num(mensual)}% mensual${aviso}`;
		},
	},
	{
		id: "seguroVidaPct",
		label: "Seguro de Vida (% mensual s/ saldo)",
		step: "0.01",
		min: "0",
		note: "Disminuye con la deuda · típ. 0.03% – 0.08%",
	},
	{
		id: "seguroHogarPct",
		label: "Seguro Incendio/Terremoto (% mensual)",
		step: "0.01",
		min: "0",
		note: "Sobre 80% del inmueble (sin lote) · fijo, no baja con la deuda",
	},
	{
		id: "aporteExtra",
		label: "Prepago a capital (COP)",
		step: "100000",
		min: "0",
		note: "Prepago parcial sin penalidad (Ley 546/99)",
	},
	{
		id: "destinoAbono",
		label: "Destino del prepago",
		options: destinos,
		cards: true,
		note: "Ley 546/99: eliges tú, sin penalidad",
	},
	{
		id: "tipoAporte",
		label: "Frecuencia del prepago",
		options: frecuencias,
	},
	{
		id: "mesAbono",
		label: "Mes del prepago único",
		step: "1",
		min: "1",
		note: "Mes en que se aplica el prepago (1 = primer mes)",
		showIf: (v) => v.tipoAporte === "unico",
	},
];

export const PESOS_FIELDS: Field[] = [
	{ id: "pValorInmueble", label: "Valor del Inmueble (COP)", step: "1000000" },
	{
		id: "pPorcentajeCredito",
		label: "Porcentaje a Financiar",
		options: pct(50, 100),
	},
	{
		id: "pPlazoAnios",
		label: "Plazo del Crédito (Años)",
		options: [5, 10, 15, 19, 20, 25, 30].map((a) => ({
			value: String(a),
			label: `${a} Años`,
		})),
	},
	{
		id: "pSistema",
		label: "Sistema de Amortización",
		options: [
			{ value: "cuotaConstante", label: "Cuota Constante en Pesos" },
			{ value: "abonoConstante", label: "Abono Constante a Capital" },
		],
	},
	{
		id: "pTasaBase",
		label: "Tasa de Interés",
		step: "0.1",
		segmented: { id: "pTasaUnidad", options: unidadesTasa },
		note: "Tasa total en pesos · ej FNA línea pesos cotiza 12,6% E.A.",
		live: (v) => equivalenciaTasa(v.pTasaBase, v.pTasaUnidad),
	},
	{
		id: "pDescuentoTasa",
		label: "Descuento Programa (E.A)",
		step: "0.1",
		min: "0",
		note: "Ej: FRECH disminuye puntos EA",
	},
	{
		id: "pSeguroVidaPct",
		label: "Seguro de Vida (% mensual s/ saldo)",
		step: "0.01",
		min: "0",
		note: "Disminuye con la deuda · típ. 0.03% – 0.08%",
	},
	{
		id: "pSeguroHogarPct",
		label: "Seguro Incendio/Terremoto (% mensual)",
		step: "0.01",
		min: "0",
		note: "Sobre 80% del inmueble (sin lote) · fijo, no baja con la deuda",
	},
	{
		id: "pAporteExtra",
		label: "Prepago a capital (COP)",
		step: "100000",
		min: "0",
		note: "Prepago parcial sin penalidad (Ley 546/99)",
	},
	{
		id: "pDestinoAbono",
		label: "Destino del prepago",
		options: destinos,
		cards: true,
		note: "Ley 546/99: eliges tú, sin penalidad",
	},
	{
		id: "pTipoAporte",
		label: "Frecuencia del prepago",
		options: frecuencias,
	},
	{
		id: "pMesAbono",
		label: "Mes del prepago único",
		step: "1",
		min: "1",
		note: "Mes en que se aplica el prepago (1 = primer mes)",
		showIf: (v) => v.pTipoAporte === "unico",
	},
];

export const UVR_DEFAULTS: Record<string, string> = {
	valorInmueble: "484203128",
	porcentajeCredito: "70",
	plazoAnios: "20",
	sistema: "cuotaConstante",
	valorUVR: "395.50",
	tasaBase: "8.1",
	tasaUnidad: "ea",
	descuentoTasa: "0.0",
	inflacion: "5.0",
	seguroVidaPct: "0.05",
	seguroHogarPct: "0.03",
	aporteExtra: "0",
	destinoAbono: "plazo",
	tipoAporte: "unico",
	mesAbono: "1",
};

export const PESOS_DEFAULTS: Record<string, string> = {
	pValorInmueble: "342174121",
	pPorcentajeCredito: "70",
	pPlazoAnios: "20",
	pSistema: "cuotaConstante",
	pTasaBase: "12.6",
	pTasaUnidad: "ea",
	pDescuentoTasa: "0.0",
	pSeguroVidaPct: "0.05",
	pSeguroHogarPct: "0.03",
	pAporteExtra: "0",
	pDestinoAbono: "plazo",
	pTipoAporte: "unico",
	pMesAbono: "1",
};

export type FaqEntry = {
	q: string;
	a: string;
	sources?: { label: string; url: string }[];
};

// Única fuente del FAQ: se renderiza en page.tsx y alimenta el JSON-LD FAQPage.
export const FAQ: FaqEntry[] = [
	{
		q: "¿Qué es la UVR y por qué cambia mi cuota mes a mes?",
		a: "La UVR (Unidad de Valor Real) es una unidad de cuenta indexada al IPC (inflación) que certifica el Banco de la República y que se usa para calcular el costo de los créditos de vivienda en Colombia desde la Ley 546 de 1999. Tu deuda se pacta en UVR y se paga en pesos al valor de la UVR del día, así que si la inflación sube, la cuota en pesos sube aunque el saldo en UVR baje.",
		sources: [
			{
				label: "Banco de la República · Glosario: UVR",
				url: "https://www.banrep.gov.co/es/glosario/uvr",
			},
			{
				label: "Banco de la República · Metodología de cálculo de la UVR",
				url: "https://www.banrep.gov.co/es/unidad-valor-real-uvr-antecedentes-y-metodologia-calculo",
			},
			{
				label: "Ley 546 de 1999 (texto completo)",
				url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=180",
			},
		],
	},
	{
		q: "¿Cuánto puedo financiar de un crédito hipotecario en Colombia?",
		a: "Como regla general, la financiación va hasta el 70% del valor del inmueble para vivienda no VIS y hasta el 80% para vivienda VIS; el resto corresponde a la cuota inicial. Algunas entidades como el FNA financian un porcentaje mayor según el tipo de vivienda y tu vinculación (cesantías o ahorro voluntario). Este simulador permite ajustar el porcentaje entre 50% y 100% para ver el efecto en la cuota.",
		sources: [
			{
				label:
					"Decreto 1077 de 2015, art. 2.1.11.1 · Condiciones de los créditos de vivienda",
				url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77216",
			},
			{
				label: "FNA · Condiciones de crédito",
				url: "https://www.fna.gov.co/vivienda/condiciones-credito",
			},
		],
	},
	{
		q: "¿Cuál es la diferencia entre cuota constante y abono constante a capital?",
		a: "En cuota constante (sistema francés) pagas siempre la misma cuota: al inicio casi todo es interés y al final casi todo es capital. En abono constante a capital pagas una cuota mayor al principio que va bajando, porque amortizas la misma porción de capital cada mes; el total de intereses es menor.",
		sources: [
			{
				label:
					"Universidad de Valladolid · Sistema de amortización francés (PDF)",
				url: "https://uvadoc.uva.es/bitstream/handle/10324/15849/TFG-E-178.pdf",
			},
		],
	},
	{
		q: "¿Los abonos a capital bajan la cuota o el plazo?",
		a: "La Ley 546 de 1999 permite prepagar el crédito de vivienda total o parcialmente en cualquier momento y sin penalidad. En los prepagos parciales, el deudor tiene derecho a elegir si el monto abonado reduce el valor de la cuota o el plazo de la obligación; la Superintendencia Financiera ha reiterado que la entidad debe acatar esa elección y actualizar la proyección de las cuotas. Reducir el plazo mantiene la cuota y suele ahorrar más intereses; reducir la cuota mantiene el plazo y baja el pago mensual. Este simulador modela ambas opciones y te muestra el ahorro de cada una.",
		sources: [
			{
				label: "Ley 546 de 1999, art. 17 num. 8 (texto completo)",
				url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=180",
			},
			{
				label: "Superfinanciera · Sentencia 20170588 (abonos: cuota o plazo)",
				url: "https://www.superfinanciera.gov.co/publicaciones/10085300/consumidor-financierofunciones-jurisdiccionales-historico-jurisprudencia-superintendencia-financiera-de-colombiacredito-hipotecario-10085300/",
			},
		],
	},
	{
		q: "¿Me conviene reducir la cuota o el plazo?",
		a: "Depende de tu objetivo. Reducir el plazo mantiene el pago mensual y concentra el ahorro en intereses: en un crédito típico de $240 millones a 20 años, un abono único de $20 millones en el mes 13 puede acortar cerca de 4,5 años y ahorrar más de $120 millones en intereses. Reducir la cuota mantiene el plazo y baja el pago mensual (alrededor de 8% en ese mismo ejemplo), lo que sirve si necesitas liberar flujo de caja, pero el ahorro en intereses es menor. La ley te da el derecho a elegir.",
		sources: [
			{
				label: "Ley 546 de 1999, art. 17 num. 8 (texto completo)",
				url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=180",
			},
		],
	},
	{
		q: "¿Este simulador sirve para créditos VIS, VIP o líneas del FNA?",
		a: "Sí. Está construido sobre tasas de referencia del Fondo Nacional del Ahorro (FNA) y permite descontar puntos por programas como FRECH (cobertura a la tasa de interés) y Mi Casa Ya, además de usar la UVR. Verifica siempre las condiciones vigentes con tu entidad financiera.",
		sources: [
			{
				label: "FNA · Tasas vigentes",
				url: "https://www.fna.gov.co/sobre-el-fna/tasas",
			},
			{
				label: "Minvivienda · Mi Casa Ya, subsidio familiar de vivienda nueva",
				url: "https://www.minvivienda.gov.co/viceministerio-de-vivienda/mi-casa-ya/subsidio-familiar-de-vivienda-nueva-0",
			},
			{
				label: "Minvivienda · VIS y VIP",
				url: "https://www.minvivienda.gov.co/viceministerio-de-vivienda-vis-y-vip",
			},
		],
	},
	{
		q: "¿Qué diferencia hay entre una tasa E.A. y una N.A.M.V.?",
		a: "La efectiva anual (E.A.) ya incluye la capitalización de los intereses durante el año; la nominal anual mes vencido (N.A.M.V.) no, y se convierte dividiendo entre 12 para obtener la tasa mensual. Por eso 12% N.A.M.V. equivale a 12,68% E.A., no a 12% E.A. Escribir una tasa N.A.M.V. en un campo que espera E.A. subestima la cuota. Este visor acepta ambas: elige la unidad junto al campo y muestra la equivalencia en E.A., N.A.M.V. y mensual antes de calcular.",
	},
	{
		q: "¿Los resultados son una cotización oficial?",
		a: "No. Es una proyección informativa de amortización, seguros y abonos a capital. No constituye una oferta ni una cotización formal, y no incluye gastos de origen como notaría, avalúo o estudio de títulos.",
	},
];

export const TIPS: Record<string, string> = {
	uvr: "UVR estimada del mes: crece con la inflación proyectada. Es la moneda indexada del crédito (Ley 546/99).",
	cuotaUVR:
		"Cuota exigida en UVR: fija en 'Cuota Constante'. En pesos crece con la inflación al pagarse con la UVR del mes.",
	interesUVR:
		"Saldo × tasa mensual. Solo la deuda genera interés; seguros e inflación no. Es la parte de la cuota que no amortiza.",
	capital:
		"Capital: parte de la cuota que amortiza deuda (cuota − interés). Crece con el tiempo. No incluye el prepago.",
	saldoUVR:
		"Deuda pendiente en UVR tras el pago del mes. Base del interés del mes siguiente.",
	prepago:
		"Prepago parcial sin penalidad (Ley 546/99). Según el destino elegido reduce el plazo (misma cuota) o la cuota (mismo plazo).",
	seguros:
		"Vida: % del saldo (baja al amortizar). Hogar: fijo, ~80% del inmueble. No generan interés.",
	cuotaTotal: "Lo que pagas este mes: (cuota + prepago) × UVR del mes + seguros.",
	saldoCOP:
		"Saldo en UVR × UVR del mes. Puede subir con la inflación aunque amortices.",
	totalPagado:
		"Suma de todo lo desembolsado desde el mes 1 hasta el cierre del crédito: cuotas exigidas + prepagos + seguros, en pesos de cada mes de pago. Incluye capital, intereses remuneratorios y el ajuste por inflación de la UVR (por eso supera el monto prestado). No incluye gastos de origen (notaría, avalúo).",
	totalPagadoPesos:
		"Suma de todo lo desembolsado desde el mes 1 hasta el cierre del crédito: cuotas exigidas + prepagos + seguros, en pesos constantes (la cuota NO crece con el tiempo). Incluye capital e intereses. No incluye gastos de origen (notaría, avalúo).",
};

// Motor de amortización hipotecaria (Colombia · Ley 546/1999).
// Portado 1:1 desde visor-credito-col/app.js — la lógica es idéntica, solo
// se separó del DOM para que sea pura y testeable.

export type SistemaAmortizacion = "cuotaConstante" | "abonoConstante";

// Ley 546/1999, art. 17 num. 8: en los prepagos parciales el deudor elige si
// el monto abonado disminuye el valor de la cuota o el plazo de la obligación.
export type DestinoAbono = "plazo" | "cuota";

// "unico" aplica el aporte una sola vez en `mesAbono`; "mensual" lo repite
// todos los meses (comportamiento histórico del visor).
export type TipoAporte = "mensual" | "unico";

export interface BaseParams {
	valorInmueble: number;
	porcentajeCredito: number; // 50..100
	plazoAnios: number;
	sistema: SistemaAmortizacion;
	tasaBaseEA: number; // % EA
	descuentoTasa: number; // % EA
	seguroVidaPct: number; // % mensual s/ saldo
	seguroHogarPct: number; // % mensual s/ construcción
	aporteExtra: number; // COP
	destinoAbono?: DestinoAbono; // por defecto "plazo"
	tipoAporte?: TipoAporte; // por defecto "unico"
	mesAbono?: number; // mes del aporte único (1..n)
}

export interface UVRParams extends BaseParams {
	valorUVR: number; // COP
	inflacionEA: number; // % EA
}

export interface FilaUVR {
	mes: number;
	uvr: number;
	cuotaUVR: number;
	interesUVR: number;
	abonoCapitalUVR: number; // programado (sin aporte extra)
	saldoUVR: number;
	aporteExtraCOP: number;
	segurosCOP: number;
	cuotaTotalCOP: number;
	saldoCOP: number;
}

export interface FilaPesos {
	mes: number;
	cuota: number;
	interes: number;
	abonoCapital: number; // programado (sin aporte extra)
	saldo: number;
	aporteExtraCOP: number;
	segurosCOP: number;
	cuotaTotalCOP: number;
}

export interface Resumen {
	montoCOP: number;
	montoUVR: number | null;
	tasaEA: number; // % EA aplicada
	cuota1: number;
	// Cuota mensual sin prepagos: cuota exigida + seguros del mes 1 / del último
	// mes. `cuota1` y `cuotaFinal` incluyen el prepago si cae en ese mes.
	mensualidad1: number;
	mensualidadFinal: number;
	cuotaAnio5: number | null; // null => ver cuotaAnio5Nota
	cuotaAnio5Nota: string;
	cuotaFinal: number;
	finCreditoMes: number;
	finNota: string;
	totalPagado: number;
	interesAcum: number;
	// Desglose de totalPagado: capital (montoCOP) + intereses + seguros +
	// ajuste UVR. En pesos el ajuste siempre es 0.
	segurosAcum: number;
	ajusteUVR: number;
	destinoAbono: DestinoAbono;
	// Cuota exigida (interés + capital programado), sin aporte ni seguros.
	// En UVR se expresa en COP con la UVR del mes correspondiente.
	cuotaExigida1: number;
	cuotaExigidaFinal: number;
	// Reducción de la cuota exigida atribuible al abono (0 si no aplica).
	// En UVR se mide en UVR para que la inflación no distorsione el porcentaje.
	reduccionCuotaPct: number;
}

export interface Simulacion<F> {
	filas: F[];
	resumen: Resumen;
	chart: {
		labels: string[];
		cuotas: number[];
		saldo: number[];
		interesAcum: number[];
	};
}

export interface Comparativa<F> {
	sinAbono: Simulacion<F>;
	plazo: Simulacion<F>;
	cuota: Simulacion<F>;
}

const EARaMensual = (ea: number) => Math.pow(1 + ea, 1 / 12) - 1;

// Cuota del sistema francés (mes 1..n con tasa mensual equivalente)
const cuotaFrancesa = (monto: number, i: number, n: number) =>
	i > 0 ? monto * ((i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)) : monto / n;

// Monto del aporte que corresponde al mes según la frecuencia elegida.
function aporteDelMes(
	p: BaseParams,
	n: number,
	mes: number,
	monto: number,
): number {
	if (!(monto > 0)) return 0;
	if ((p.tipoAporte ?? "unico") === "mensual") return monto;
	const mesAbono = Math.min(Math.max(1, Math.round(p.mesAbono ?? 1)), n);
	return mes === mesAbono ? monto : 0;
}

function resumenComun(
	p: BaseParams,
	tasaFinalEA: number,
	n: number,
	cuota1: number,
	cuotaAnio5: number,
	cuotaFinal: number,
	mesFinCredito: number,
	totalPagado: number,
	interesAcum: number,
	extra: {
		destinoAbono: DestinoAbono;
		cuotaExigida1: number;
		cuotaExigidaFinal: number;
		seguros1: number;
		segurosFinal: number;
		segurosAcum: number;
		ajusteUVR: number;
	},
): Resumen {
	let cuotaAnio5Nota = "";
	let cuotaAnio5Val: number | null = cuotaAnio5;
	if (p.plazoAnios < 5) {
		cuotaAnio5Val = null;
		cuotaAnio5Nota = "N/A (Plazo menor)";
	} else if (mesFinCredito < 60) {
		cuotaAnio5Val = null;
		cuotaAnio5Nota = "N/A (Cancelado antes)";
	}

	let finNota: string;
	if (mesFinCredito < n) {
		finNota = `Cancela ${n - mesFinCredito} meses antes`;
	} else if (p.aporteExtra > 0 && extra.destinoAbono === "cuota") {
		finNota = "Plazo contratado · cuota reducida";
	} else if (p.aporteExtra > 0) {
		finNota = "Sin efecto";
	} else {
		finNota = "Plazo contratado";
	}

	return {
		montoCOP: p.valorInmueble * (p.porcentajeCredito / 100),
		montoUVR: null,
		tasaEA: tasaFinalEA * 100,
		cuota1,
		mensualidad1: extra.cuotaExigida1 + extra.seguros1,
		mensualidadFinal: extra.cuotaExigidaFinal + extra.segurosFinal,
		cuotaAnio5: cuotaAnio5Val,
		cuotaAnio5Nota,
		cuotaFinal,
		finCreditoMes: mesFinCredito,
		finNota,
		totalPagado,
		interesAcum,
		segurosAcum: extra.segurosAcum,
		ajusteUVR: extra.ajusteUVR,
		destinoAbono: extra.destinoAbono,
		cuotaExigida1: extra.cuotaExigida1,
		cuotaExigidaFinal: extra.cuotaExigidaFinal,
		reduccionCuotaPct: 0,
	};
}

function muestrear(
	chart: Simulacion<unknown>["chart"],
	mes: number,
	n: number,
	paso: number,
	cuota: number,
	saldo: number,
	interesAcum: number,
) {
	if (mes === 1 || mes === n || (mes - 1) % paso === 0) {
		chart.labels.push(`Mes ${mes}`);
		chart.cuotas.push(Math.round(cuota));
		chart.saldo.push(Math.round(saldo));
		chart.interesAcum.push(Math.round(interesAcum));
	}
}

// Punto final exacto: el cierre puede caer entre las muestras del paso
function cerrarMuestreo(
	chart: Simulacion<unknown>["chart"],
	ultimoMes: number,
	cuota: number,
	saldo: number,
	interesAcum: number,
) {
	const last = chart.labels[chart.labels.length - 1];
	if (chart.labels.length === 0 || last !== `Mes ${ultimoMes}`) {
		chart.labels.push(`Mes ${ultimoMes}`);
		chart.cuotas.push(Math.round(cuota));
		chart.saldo.push(Math.round(saldo));
		chart.interesAcum.push(Math.round(interesAcum));
	}
}

export function simularUVR(p: UVRParams): Simulacion<FilaUVR> {
	if (!(p.valorInmueble > 0) || !(p.valorUVR > 0) || isNaN(p.tasaBaseEA) || isNaN(p.inflacionEA)) {
		throw new Error(
			"Revise los campos: valor del inmueble, valor UVR, tasa e inflación deben ser válidos.",
		);
	}

	const destinoAbono = p.destinoAbono ?? "plazo";
	const aporteExtra = Math.max(0, p.aporteExtra || 0);
	const valorConstruible = p.valorInmueble * 0.8;
	const tasaFinalEA = Math.max(0, (p.tasaBaseEA - p.descuentoTasa) / 100);

	const n = p.plazoAnios * 12;
	const montoCOP = p.valorInmueble * (p.porcentajeCredito / 100);
	const montoUVR = montoCOP / p.valorUVR;
	const iMensual = EARaMensual(tasaFinalEA);
	const infMensual = EARaMensual(p.inflacionEA / 100);
	const cuotaUVRFija =
		p.sistema === "cuotaConstante" ? cuotaFrancesa(montoUVR, iMensual, n) : 0;
	const abonoConstanteUVR = montoUVR / n;
	const paso = Math.max(1, Math.ceil(n / 60));

	let saldoUVR = montoUVR;
	let uvrActual = p.valorUVR;
	// Estado de la cuota exigida: constante salvo que el abono reduzca cuota.
	let cuotaUVRActual = cuotaUVRFija;
	let abonoUVRActual = abonoConstanteUVR;
	let mesFinCredito = n;
	let totalPagado = 0;
	let interesAcum = 0;
	let segurosAcum = 0;
	// Capital amortizado convertido a pesos del mes de pago. Su exceso sobre el
	// monto prestado es el ajuste por indexación de la UVR.
	let capitalCOP = 0;
	let cuota1 = 0;
	let cuotaAnio5 = 0;
	let cuotaFinal = 0;
	let cuotaExigida1 = 0;
	let cuotaExigidaFinal = 0;
	let cuotaExigida1UVR = 0;
	let cuotaExigidaFinalUVR = 0;
	let seguros1 = 0;
	let segurosFinal = 0;
	let lastCuota = 0;
	let lastSaldo = 0;

	const filas: FilaUVR[] = [];
	const chart = { labels: [] as string[], cuotas: [] as number[], saldo: [] as number[], interesAcum: [] as number[] };

	for (let mes = 1; mes <= n; mes++) {
		const interesUVR = saldoUVR * iMensual;
		const abonoBaseUVR =
			p.sistema === "cuotaConstante"
				? Math.min(cuotaUVRActual - interesUVR, saldoUVR)
				: Math.min(abonoUVRActual, saldoUVR);
		const aporteMesUVR = aporteDelMes(p, n, mes, aporteExtra) / uvrActual;
		const abonoExtraUVR = Math.min(
			aporteMesUVR,
			Math.max(0, saldoUVR - abonoBaseUVR),
		);
		const abonoCapitalUVR = abonoBaseUVR + abonoExtraUVR;
		const cuotaUVR = interesUVR + abonoBaseUVR; // cuota exigida (parcial si cierra este mes)
		const cuotaExigidaUVR =
			p.sistema === "cuotaConstante"
				? cuotaUVRActual
				: abonoUVRActual + interesUVR;

		saldoUVR -= abonoCapitalUVR;
		if (saldoUVR < 0.01) saldoUVR = 0; // corrección de redondeo final
		if (saldoUVR === 0 && mes < n) mesFinCredito = mes;

		interesAcum += interesUVR * uvrActual;

		const segurosCOP =
			saldoUVR * uvrActual * (p.seguroVidaPct / 100) +
			valorConstruible * (p.seguroHogarPct / 100);
		const cuotaCOP = (cuotaUVR + abonoExtraUVR) * uvrActual + segurosCOP;
		const cuotaExigidaCOP = cuotaUVR * uvrActual + segurosCOP;
		const saldoCOP = saldoUVR * uvrActual;
		totalPagado += cuotaCOP;
		segurosAcum += segurosCOP;
		capitalCOP += abonoCapitalUVR * uvrActual;

		if (mes === 1) {
			cuota1 = cuotaCOP;
			cuotaExigida1 = cuotaExigidaUVR * uvrActual;
			cuotaExigida1UVR = cuotaExigidaUVR;
			seguros1 = segurosCOP;
		}
		if (mes === 60 && saldoUVR > 0) cuotaAnio5 = cuotaCOP;
		cuotaFinal = cuotaCOP;
		cuotaExigidaFinal = cuotaExigidaUVR * uvrActual;
		cuotaExigidaFinalUVR = cuotaExigidaUVR;
		segurosFinal = segurosCOP;
		lastCuota = cuotaExigidaCOP;
		lastSaldo = saldoCOP;

		muestrear(chart, mes, n, paso, cuotaExigidaCOP, saldoCOP, interesAcum);

		filas.push({
			mes,
			uvr: uvrActual,
			cuotaUVR,
			interesUVR,
			abonoCapitalUVR: abonoBaseUVR,
			saldoUVR,
			aporteExtraCOP: abonoExtraUVR * uvrActual,
			segurosCOP,
			cuotaTotalCOP: cuotaCOP,
			saldoCOP,
		});

		// Re-amortización para el mes siguiente: solo si el abono va a cuota.
		if (
			destinoAbono === "cuota" &&
			abonoExtraUVR > 0 &&
			saldoUVR > 0 &&
			mes < n
		) {
			if (p.sistema === "cuotaConstante") {
				cuotaUVRActual = cuotaFrancesa(saldoUVR, iMensual, n - mes);
			} else {
				abonoUVRActual = saldoUVR / (n - mes);
			}
		}

		// La UVR crece DESPUÉS del pago, con la inflación proyectada
		uvrActual *= 1 + infMensual;

		if (saldoUVR === 0) break; // cerrado por aportes adicionales
	}

	cerrarMuestreo(chart, filas.length, lastCuota, lastSaldo, interesAcum);

	const resumen = resumenComun(
		{ ...p, aporteExtra }, tasaFinalEA, n, cuota1, cuotaAnio5, cuotaFinal,
		mesFinCredito, totalPagado, interesAcum,
		{
			destinoAbono,
			cuotaExigida1,
			cuotaExigidaFinal,
			seguros1,
			segurosFinal,
			segurosAcum,
			ajusteUVR: capitalCOP - montoCOP,
		},
	);
	resumen.montoUVR = montoUVR;
	resumen.reduccionCuotaPct =
		destinoAbono === "cuota" && cuotaExigida1UVR > 0
			? Math.max(0, 1 - cuotaExigidaFinalUVR / cuotaExigida1UVR)
			: 0;
	return { filas, resumen, chart };
}

export function simularPesos(p: BaseParams): Simulacion<FilaPesos> {
	if (!(p.valorInmueble > 0) || isNaN(p.tasaBaseEA)) {
		throw new Error("Revise los campos: valor del inmueble y tasa deben ser válidos.");
	}

	const destinoAbono = p.destinoAbono ?? "plazo";
	const aporteExtra = Math.max(0, p.aporteExtra || 0);
	const valorConstruible = p.valorInmueble * 0.8;
	const tasaFinalEA = Math.max(0, (p.tasaBaseEA - p.descuentoTasa) / 100);

	const n = p.plazoAnios * 12;
	const montoCOP = p.valorInmueble * (p.porcentajeCredito / 100);
	const iMensual = EARaMensual(tasaFinalEA);
	const cuotaFija = p.sistema === "cuotaConstante" ? cuotaFrancesa(montoCOP, iMensual, n) : 0;
	const abonoConstanteCOP = montoCOP / n;
	const paso = Math.max(1, Math.ceil(n / 60));

	let saldo = montoCOP;
	// Estado de la cuota exigida: constante salvo que el abono reduzca cuota.
	let cuotaActual = cuotaFija;
	let abonoActual = abonoConstanteCOP;
	let mesFinCredito = n;
	let totalPagado = 0;
	let interesAcum = 0;
	let segurosAcum = 0;
	let cuota1 = 0;
	let cuotaAnio5 = 0;
	let cuotaFinal = 0;
	let cuotaExigida1 = 0;
	let cuotaExigidaFinal = 0;
	let seguros1 = 0;
	let segurosFinal = 0;
	let lastCuota = 0;
	let lastSaldo = 0;

	const filas: FilaPesos[] = [];
	const chart = { labels: [] as string[], cuotas: [] as number[], saldo: [] as number[], interesAcum: [] as number[] };

	for (let mes = 1; mes <= n; mes++) {
		const interes = saldo * iMensual;
		const abonoBase =
			p.sistema === "cuotaConstante"
				? Math.min(cuotaActual - interes, saldo)
				: Math.min(abonoActual, saldo);
		const aporteMes = aporteDelMes(p, n, mes, aporteExtra);
		const abonoExtra = Math.min(aporteMes, Math.max(0, saldo - abonoBase));
		const abonoCapital = abonoBase + abonoExtra;
		const cuota = interes + abonoBase; // cuota exigida (parcial si cierra este mes)
		const cuotaExigida =
			p.sistema === "cuotaConstante" ? cuotaActual : abonoActual + interes;

		saldo -= abonoCapital;
		if (saldo < 0.01) saldo = 0;
		if (saldo === 0 && mes < n) mesFinCredito = mes;

		interesAcum += interes; // los seguros NO generan interés

		const segurosCOP =
			saldo * (p.seguroVidaPct / 100) + valorConstruible * (p.seguroHogarPct / 100);
		const cuotaTotalCOP = cuota + abonoExtra + segurosCOP;
		const cuotaExigidaCOP = cuota + segurosCOP;
		totalPagado += cuotaTotalCOP;
		segurosAcum += segurosCOP;

		if (mes === 1) {
			cuota1 = cuotaTotalCOP;
			cuotaExigida1 = cuotaExigida;
			seguros1 = segurosCOP;
		}
		if (mes === 60 && saldo > 0) cuotaAnio5 = cuotaTotalCOP;
		cuotaFinal = cuotaTotalCOP;
		cuotaExigidaFinal = cuotaExigida;
		segurosFinal = segurosCOP;
		lastCuota = cuotaExigidaCOP;
		lastSaldo = saldo;

		muestrear(chart, mes, n, paso, cuotaExigidaCOP, saldo, interesAcum);

		filas.push({
			mes,
			cuota,
			interes,
			abonoCapital: abonoBase,
			saldo,
			aporteExtraCOP: abonoExtra,
			segurosCOP,
			cuotaTotalCOP,
		});

		// Re-amortización para el mes siguiente: solo si el abono va a cuota.
		if (destinoAbono === "cuota" && abonoExtra > 0 && saldo > 0 && mes < n) {
			if (p.sistema === "cuotaConstante") {
				cuotaActual = cuotaFrancesa(saldo, iMensual, n - mes);
			} else {
				abonoActual = saldo / (n - mes);
			}
		}

		if (saldo === 0) break;
	}

	cerrarMuestreo(chart, filas.length, lastCuota, lastSaldo, interesAcum);

	const resumen = resumenComun(
		{ ...p, aporteExtra }, tasaFinalEA, n, cuota1, cuotaAnio5, cuotaFinal,
		mesFinCredito, totalPagado, interesAcum,
		{ destinoAbono, cuotaExigida1, cuotaExigidaFinal, seguros1, segurosFinal, segurosAcum, ajusteUVR: 0 },
	);
	resumen.reduccionCuotaPct =
		destinoAbono === "cuota" && cuotaExigida1 > 0
			? Math.max(0, 1 - cuotaExigidaFinal / cuotaExigida1)
			: 0;
	return { filas, resumen, chart };
}

// Corre las tres variantes (sin abono, reducir plazo, reducir cuota) para que
// la UI pueda comparar sin repetir la lógica de negocio.
export function compararPesos(p: BaseParams): Comparativa<FilaPesos> {
	return {
		sinAbono: simularPesos({ ...p, aporteExtra: 0 }),
		plazo: simularPesos({ ...p, destinoAbono: "plazo" }),
		cuota: simularPesos({ ...p, destinoAbono: "cuota" }),
	};
}

export function compararUVR(p: UVRParams): Comparativa<FilaUVR> {
	return {
		sinAbono: simularUVR({ ...p, aporteExtra: 0 }),
		plazo: simularUVR({ ...p, destinoAbono: "plazo" }),
		cuota: simularUVR({ ...p, destinoAbono: "cuota" }),
	};
}

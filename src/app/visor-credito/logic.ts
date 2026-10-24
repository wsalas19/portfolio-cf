// Puente entre el formulario (strings) y el motor puro de @/lib/credito,
// más la exportación CSV. Sin JSX ni estado.

import {
	BaseParams,
	DestinoAbono,
	FilaPesos,
	FilaUVR,
	Simulacion,
	TipoAporte,
	UVRParams,
} from "@/lib/credito";

function destino(v: Record<string, string>, id: string): DestinoAbono {
	return v[id] === "cuota" ? "cuota" : "plazo";
}

function frecuencia(v: Record<string, string>, id: string): TipoAporte {
	return v[id] === "mensual" ? "mensual" : "unico";
}

export function uvrParamsFrom(v: Record<string, string>): UVRParams {
	const num = (id: string) => parseFloat(v[id]);
	return {
		valorInmueble: num("valorInmueble"),
		porcentajeCredito: num("porcentajeCredito"),
		plazoAnios: parseInt(v.plazoAnios),
		sistema: v.sistema as UVRParams["sistema"],
		tasaBaseEA: num("tasaBase"),
		descuentoTasa: num("descuentoTasa") || 0,
		seguroVidaPct: num("seguroVidaPct") || 0,
		seguroHogarPct: num("seguroHogarPct") || 0,
		aporteExtra: num("aporteExtra") || 0,
		destinoAbono: destino(v, "destinoAbono"),
		tipoAporte: frecuencia(v, "tipoAporte"),
		mesAbono: parseInt(v.mesAbono) || 1,
		valorUVR: num("valorUVR"),
		inflacionEA: num("inflacion"),
	};
}

export function pesosParamsFrom(v: Record<string, string>): BaseParams {
	const num = (id: string) => parseFloat(v[id]);
	return {
		valorInmueble: num("pValorInmueble"),
		porcentajeCredito: num("pPorcentajeCredito"),
		plazoAnios: parseInt(v.pPlazoAnios),
		sistema: v.pSistema as BaseParams["sistema"],
		tasaBaseEA: num("pTasaBase"),
		descuentoTasa: num("pDescuentoTasa") || 0,
		seguroVidaPct: num("pSeguroVidaPct") || 0,
		seguroHogarPct: num("pSeguroHogarPct") || 0,
		aporteExtra: num("pAporteExtra") || 0,
		destinoAbono: destino(v, "pDestinoAbono"),
		tipoAporte: frecuencia(v, "pTipoAporte"),
		mesAbono: parseInt(v.pMesAbono) || 1,
	};
}

// Separador ';' + BOM para que Excel es-CO abra las columnas correctamente
function descargarCSV(nombre: string, encabezado: string, filas: unknown[][]) {
	const blob = new Blob(
		["﻿" + encabezado + "\n" + filas.map((f) => f.join(";")).join("\n")],
		{ type: "text/csv;charset=utf-8;" },
	);
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = nombre;
	a.click();
	URL.revokeObjectURL(a.href);
}

export function descargarUVR(r: Simulacion<FilaUVR>) {
	descargarCSV(
		`amortizacion_hipotecaria_${r.resumen.destinoAbono === "cuota" ? "reducir_cuota" : "reducir_plazo"}.csv`,
		"Mes;Valor UVR;Cuota UVR;Interes UVR;Abono Capital UVR;Saldo Capital UVR;Aporte Extra COP;Seguros COP;Cuota Total COP;Saldo Capital COP",
		r.filas.map((f) => [
			f.mes,
			f.uvr.toFixed(2),
			f.cuotaUVR.toFixed(2),
			f.interesUVR.toFixed(2),
			f.abonoCapitalUVR.toFixed(2),
			f.saldoUVR.toFixed(2),
			Math.round(f.aporteExtraCOP),
			Math.round(f.segurosCOP),
			Math.round(f.cuotaTotalCOP),
			Math.round(f.saldoCOP),
		]),
	);
}

export function descargarPesos(r: Simulacion<FilaPesos>) {
	descargarCSV(
		`amortizacion_pesos_${r.resumen.destinoAbono === "cuota" ? "reducir_cuota" : "reducir_plazo"}.csv`,
		"Mes;Cuota COP;Interes COP;Abono Capital COP;Saldo Capital COP;Aporte Extra COP;Seguros COP;Cuota Total COP",
		r.filas.map((f) => [
			f.mes,
			Math.round(f.cuota),
			Math.round(f.interes),
			Math.round(f.abonoCapital),
			Math.round(f.saldo),
			Math.round(f.aporteExtraCOP),
			Math.round(f.segurosCOP),
			Math.round(f.cuotaTotalCOP),
		]),
	);
}

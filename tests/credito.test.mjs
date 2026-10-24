// Chequeos del motor de amortización (COP y UVR).
//
//   node --test tests/credito.test.mjs
//
// Igual que `admin-auth.test.mjs`: .mjs para quedar fuera del `include` de
// tsconfig.json y poder importar el .ts directo (Node 25 ya hace type stripping).
// Solo módulos puros: `project-images.ts` y `twitter/parser.ts` importan
// "server-only" y además usan el alias `@/`, así que no se pueden cargar acá sin
// montar un resolver — quedan para otro tipo de prueba.
import assert from "node:assert/strict";
import test from "node:test";
import {
	compararPesos,
	compararUVR,
	simularPesos,
	simularUVR,
} from "../src/lib/credito.ts";

// Parámetros de referencia de una hipoteca típica en pesos.
const PESOS = {
	valorInmueble: 300_000_000,
	porcentajeCredito: 70,
	plazoAnios: 20,
	sistema: "cuotaConstante",
	tasaBaseEA: 12,
	descuentoTasa: 0,
	seguroVidaPct: 0.05,
	seguroHogarPct: 0.03,
	aporteExtra: 0,
	destinoAbono: "plazo",
	tipoAporte: "mensual",
	mesAbono: 1,
};

const UVR = {
	...PESOS,
	valorUVR: 400,
	inflacionEA: 4,
};

const N = PESOS.plazoAnios * 12;
const MONTO = PESOS.valorInmueble * (PESOS.porcentajeCredito / 100);
const APORTE_UNICO = {
	...PESOS,
	aporteExtra: 20_000_000,
	tipoAporte: "unico",
	mesAbono: 13,
};

test("pesos · cuota constante: cierra el crédito en el plazo y sin saldo", () => {
	const { filas, resumen } = simularPesos(PESOS);

	assert.equal(filas.length, N);
	assert.equal(filas[0].saldo > 0, true);
	assert.equal(filas.at(-1).saldo, 0);
	assert.equal(resumen.finCreditoMes, N);
	assert.equal(resumen.finNota, "Plazo contratado");
});

test("pesos · los totales son coherentes (se paga más que el principal)", () => {
	const { resumen } = simularPesos(PESOS);

	assert.ok(resumen.montoCOP === MONTO);
	assert.ok(resumen.cuota1 > 0);
	assert.ok(resumen.interesAcum > 0);
	assert.ok(resumen.totalPagado > MONTO, "total > principal por los intereses");
	// El principal se amortiza completo, así que el total supera al monto por los
	// intereses (ya no por saldo pendiente).
	assert.ok(resumen.totalPagado - resumen.interesAcum >= MONTO * 0.98);
});

test("pesos · abono constante: el abono a capital no cambia mes a mes", () => {
	const { filas } = simularPesos({ ...PESOS, sistema: "abonoConstante" });
	const abono = filas[0].abonoCapital;

	for (const fila of filas.slice(0, -1)) {
		assert.ok(Math.abs(fila.abonoCapital - abono) < 1e-6, `mes ${fila.mes}`);
	}
	assert.equal(filas.at(-1).saldo, 0);
});

test("pesos · un aporte mensual a capital cancela antes del plazo", () => {
	const base = simularPesos(PESOS);
	const conExtra = simularPesos({ ...PESOS, aporteExtra: 1_000_000 });

	assert.ok(conExtra.resumen.finCreditoMes < base.resumen.finCreditoMes);
	assert.match(conExtra.resumen.finNota, /Cancela/);
	assert.ok(conExtra.resumen.interesAcum < base.resumen.interesAcum);
});

test("pesos · abono constante también admite aportes (plazo y cuota)", () => {
	const base = simularPesos({ ...PESOS, sistema: "abonoConstante" });

	const plazo = simularPesos({
		...PESOS,
		sistema: "abonoConstante",
		aporteExtra: 1_000_000,
		destinoAbono: "plazo",
	});
	assert.ok(plazo.resumen.finCreditoMes < base.resumen.finCreditoMes);

	const cuota = simularPesos({
		...PESOS,
		sistema: "abonoConstante",
		aporteExtra: 20_000_000,
		tipoAporte: "unico",
		mesAbono: 13,
		destinoAbono: "cuota",
	});
	assert.equal(cuota.resumen.finCreditoMes, N);
	assert.ok(cuota.resumen.cuotaExigidaFinal < base.resumen.cuotaExigidaFinal);
});

test("pesos · reducir cuota mantiene el plazo y baja la cuota", () => {
	const base = simularPesos(PESOS);
	const plazo = simularPesos({ ...APORTE_UNICO, destinoAbono: "plazo" });
	const cuota = simularPesos({ ...APORTE_UNICO, destinoAbono: "cuota" });

	// El aporte único a plazo acorta el crédito; a cuota conserva el plazo.
	assert.ok(plazo.resumen.finCreditoMes < N);
	assert.equal(cuota.resumen.finCreditoMes, N);

	// La cuota exigida baja y se mantiene hasta el final.
	assert.ok(cuota.resumen.cuotaExigidaFinal < cuota.resumen.cuotaExigida1);
	assert.ok(cuota.resumen.cuotaExigidaFinal < base.resumen.cuotaExigidaFinal);
	assert.ok(
		cuota.resumen.reduccionCuotaPct > 0.05 &&
			cuota.resumen.reduccionCuotaPct < 0.2,
		"la reducción porcentual debe ser razonable",
	);

	// Ambas ahorran intereses, pero reducir plazo ahorra más.
	assert.ok(cuota.resumen.interesAcum < base.resumen.interesAcum);
	assert.ok(plazo.resumen.interesAcum < cuota.resumen.interesAcum);

	// Sin abono la nota es distinta de "sin efecto".
	assert.match(cuota.resumen.finNota, /cuota reducida/);
});

test("pesos · el aporte único solo se aplica en el mes elegido", () => {
	const { filas } = simularPesos({ ...APORTE_UNICO, destinoAbono: "plazo" });

	for (const fila of filas.slice(0, 12)) {
		assert.equal(fila.aporteExtraCOP, 0, `mes ${fila.mes}`);
	}
	assert.ok(filas[12].aporteExtraCOP > 0, "mes 13 recibe el aporte");
});

test("pesos · sin aporte, reducir cuota y reducir plazo son idénticos", () => {
	const { resumen: plazo } = simularPesos({ ...PESOS, destinoAbono: "plazo" });
	const { resumen: cuota } = simularPesos({ ...PESOS, destinoAbono: "cuota" });

	assert.equal(cuota.interesAcum, plazo.interesAcum);
	assert.equal(cuota.cuotaExigidaFinal, plazo.cuotaExigidaFinal);
	assert.equal(cuota.finCreditoMes, plazo.finCreditoMes);
});

test("pesos · invariantes de la tabla (interés + abono = cuota)", () => {
	const { filas } = simularPesos({ ...APORTE_UNICO, destinoAbono: "cuota" });
	let saldoAnterior = MONTO;

	for (const f of filas) {
		assert.ok(Math.abs(f.interes + f.abonoCapital - f.cuota) < 1e-6, `mes ${f.mes}`);
		const esperado = saldoAnterior - f.abonoCapital - f.aporteExtraCOP;
		assert.ok(Math.abs(esperado - f.saldo) < 1e-6, `mes ${f.mes}`);
		saldoAnterior = f.saldo;
	}
	assert.equal(saldoAnterior, 0);
});

test("pesos · el chart muestra la cuota exigida, no el aporte único", () => {
	const { chart } = simularPesos({ ...APORTE_UNICO, destinoAbono: "plazo" });
	const i = chart.labels.indexOf("Mes 13");

	assert.ok(i >= 0, "el mes 13 debe estar muestreado");
	assert.ok(
		chart.cuotas[i] < 3_500_000,
		`la cuota del mes 13 no debe incluir los $20M del aporte: ${chart.cuotas[i]}`,
	);
});

test("pesos · un aporte mayor al saldo no genera saldos negativos", () => {
	const { filas } = simularPesos({
		...PESOS,
		aporteExtra: MONTO * 2,
		tipoAporte: "unico",
		mesAbono: 1,
		destinoAbono: "cuota",
	});

	assert.equal(filas.at(-1).saldo, 0);
	for (const f of filas) assert.ok(f.saldo >= 0, `mes ${f.mes}`);
});

test("pesos · un descuento de tasa baja los intereses", () => {
	const sinDescuento = simularPesos(PESOS);
	const conDescuento = simularPesos({ ...PESOS, descuentoTasa: 2 });

	assert.ok(conDescuento.resumen.tasaEA < sinDescuento.resumen.tasaEA);
	assert.ok(conDescuento.resumen.interesAcum < sinDescuento.resumen.interesAcum);
});

test("pesos · valida las entradas", () => {
	assert.throws(() => simularPesos({ ...PESOS, valorInmueble: 0 }));
	assert.throws(() => simularPesos({ ...PESOS, tasaBaseEA: NaN }));
});

test("pesos · compararPesos devuelve las tres variantes ordenadas por ahorro", () => {
	const c = compararPesos(APORTE_UNICO);

	assert.ok(c.sinAbono.resumen.interesAcum > c.cuota.resumen.interesAcum);
	assert.ok(c.cuota.resumen.interesAcum > c.plazo.resumen.interesAcum);
	assert.equal(c.sinAbono.resumen.destinoAbono, "plazo");
	assert.equal(c.plazo.resumen.destinoAbono, "plazo");
	assert.equal(c.cuota.resumen.destinoAbono, "cuota");
});

test("uvr · cierra el crédito y reporta monto en UVR", () => {
	const { filas, resumen } = simularUVR(UVR);

	assert.equal(filas.length, N);
	assert.equal(filas.at(-1).saldoUVR, 0);
	assert.ok(resumen.montoUVR !== null && resumen.montoUVR > 0);
	assert.ok(resumen.totalPagado > 0);
	// La UVR crece con la inflación, así que la primera UVR es la de entrada.
	assert.equal(filas[0].uvr, UVR.valorUVR);
	assert.ok(filas.at(-1).uvr > filas[0].uvr);
});

test("uvr · reducir cuota baja la cuota en UVR y conserva el plazo", () => {
	const base = simularUVR(UVR);
	const plano = simularUVR({ ...APORTE_UNICO, valorUVR: 400, inflacionEA: 4 });
	const cuota = simularUVR({
		...APORTE_UNICO,
		valorUVR: 400,
		inflacionEA: 4,
		destinoAbono: "cuota",
	});

	assert.equal(cuota.resumen.finCreditoMes, N);
	assert.ok(cuota.filas[0].cuotaUVR > 0);
	assert.ok(
		cuota.filas.at(-1).cuotaUVR < base.filas.at(-1).cuotaUVR,
		"la cuota en UVR baja tras el abono",
	);
	assert.ok(cuota.resumen.interesAcum < base.resumen.interesAcum);
	assert.ok(plano.resumen.interesAcum < cuota.resumen.interesAcum);
	assert.ok(cuota.resumen.reduccionCuotaPct > 0.03);
	assert.equal(cuota.filas.at(-1).saldoUVR, 0);
});

test("uvr · compararUVR devuelve las tres variantes", () => {
	const c = compararUVR({ ...APORTE_UNICO, valorUVR: 400, inflacionEA: 4 });

	assert.ok(c.sinAbono.resumen.interesAcum > c.cuota.resumen.interesAcum);
	assert.ok(c.cuota.resumen.interesAcum > c.plazo.resumen.interesAcum);
});

test("uvr · valida valor UVR y tasa", () => {
	assert.throws(() => simularUVR({ ...UVR, valorUVR: 0 }));
	assert.throws(() => simularUVR({ ...UVR, inflacionEA: NaN }));
});

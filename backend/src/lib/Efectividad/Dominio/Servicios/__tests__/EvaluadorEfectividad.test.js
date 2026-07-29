const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluar } = require("../EvaluadorEfectividad");

const pacienteBajar = { objetivo: "Bajar de peso" };
const pacienteSubir = { objetivo: "Subir masa muscular" };
const pacienteMantener = { objetivo: "Mantener peso" };

function resumen(porcentajeCumplimiento, totalRegistros = 5) {
  return { totalRegistros, porcentajeCumplimiento };
}

function puntoPeso(peso, fecha) {
  return { peso, fecha };
}

test("informacion_insuficiente: sin registros de cumplimiento y menos de 2 registros de peso", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(null, 0),
    registrosPeso: [puntoPeso(70, "2026-01-01")],
  });
  assert.equal(resultado.indicador, "informacion_insuficiente");
  assert.equal(resultado.detalle.tendenciaPeso, "sin_datos");
});

test("informacion_insuficiente: sin resumenSeguimiento (null) y sin registros de peso", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: null,
    registrosPeso: [],
  });
  assert.equal(resultado.indicador, "informacion_insuficiente");
});

test("efectiva: buen cumplimiento y peso bajando hacia el objetivo (bajar)", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(85),
    registrosPeso: [puntoPeso(80, "2026-01-01"), puntoPeso(78, "2026-02-01")],
  });
  assert.equal(resultado.indicador, "efectiva");
  assert.equal(resultado.detalle.tendenciaPeso, "mejorando");
  assert.equal(resultado.detalle.deltaPesoKg, -2);
});

test("necesita_ajustes: cumplimiento bajo + peso retrocediendo respecto al objetivo", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(30),
    registrosPeso: [puntoPeso(78, "2026-01-01"), puntoPeso(81, "2026-02-01")], // subió, objetivo era bajar
  });
  assert.equal(resultado.indicador, "necesita_ajustes");
  assert.equal(resultado.detalle.tendenciaPeso, "retrocediendo");
});

test("parcialmente_efectiva: señales mixtas sin llegar a ningún extremo", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(60),
    registrosPeso: [puntoPeso(80, "2026-01-01"), puntoPeso(79.8, "2026-02-01")], // dentro de tolerancia
  });
  assert.equal(resultado.indicador, "parcialmente_efectiva");
  assert.equal(resultado.detalle.tendenciaPeso, "manteniendose");
});

test("objetivo subir: peso subiendo es mejorando, peso bajando es retrocediendo", () => {
  const mejorando = evaluar({
    paciente: pacienteSubir,
    resumenSeguimiento: resumen(70),
    registrosPeso: [puntoPeso(60, "2026-01-01"), puntoPeso(62, "2026-02-01")],
  });
  assert.equal(mejorando.detalle.tendenciaPeso, "mejorando");

  const retrocediendo = evaluar({
    paciente: pacienteSubir,
    resumenSeguimiento: resumen(70),
    registrosPeso: [puntoPeso(62, "2026-01-01"), puntoPeso(60, "2026-02-01")],
  });
  assert.equal(retrocediendo.detalle.tendenciaPeso, "retrocediendo");
});

test("objetivo mantener: dentro de tolerancia es manteniendose, fuera es cambio_notable", () => {
  const estable = evaluar({
    paciente: pacienteMantener,
    resumenSeguimiento: resumen(70),
    registrosPeso: [puntoPeso(70, "2026-01-01"), puntoPeso(70.2, "2026-02-01")],
  });
  assert.equal(estable.detalle.tendenciaPeso, "manteniendose");

  const cambioNotable = evaluar({
    paciente: pacienteMantener,
    resumenSeguimiento: resumen(70),
    registrosPeso: [puntoPeso(70, "2026-01-01"), puntoPeso(72, "2026-02-01")],
  });
  assert.equal(cambioNotable.detalle.tendenciaPeso, "cambio_notable");
});

test("compara el primer y el último registro de peso, no solo los dos últimos", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(70),
    registrosPeso: [
      puntoPeso(85, "2026-01-01"),
      puntoPeso(82, "2026-02-01"),
      puntoPeso(80, "2026-03-01"),
    ],
  });
  assert.equal(resultado.detalle.deltaPesoKg, -5);
});

test("solo hay datos de cumplimiento (sin registros de peso suficientes): igual evalúa, sin tendencia de peso", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenSeguimiento: resumen(90),
    registrosPeso: [],
  });
  assert.notEqual(resultado.indicador, "informacion_insuficiente");
  assert.equal(resultado.detalle.tendenciaPeso, "sin_datos");
  assert.ok(resultado.motivos.some((m) => m.includes("Menos de 2 registros de peso")));
});

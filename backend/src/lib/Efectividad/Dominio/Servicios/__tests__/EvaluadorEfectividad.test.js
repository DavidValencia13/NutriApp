const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluar } = require("../EvaluadorEfectividad");

const pacienteBajar = { objetivo: "Bajar de peso" };
const pacienteSubir = { objetivo: "Subir masa muscular" };
const pacienteMantener = { objetivo: "Mantener peso" };

function resumen(porcentajeCumplimiento, totalRegistros = 5) {
  return { totalRegistros, porcentajeCumplimiento };
}

function consulta(peso, fecha) {
  return { peso, fecha };
}

test("informacion_insuficiente: sin registros de cumplimiento y menos de 2 consultas", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(null, 0),
    alertas: [],
    consultas: [consulta(70, "2026-01-01")],
  });
  assert.equal(resultado.indicador, "informacion_insuficiente");
  assert.equal(resultado.detalle.tendenciaPeso, "sin_datos");
});

test("informacion_insuficiente: sin resumenCumplimiento (null) y sin consultas", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: null,
    alertas: [],
    consultas: [],
  });
  assert.equal(resultado.indicador, "informacion_insuficiente");
});

test("efectiva: buen cumplimiento, peso bajando (objetivo bajar), sin alertas pendientes", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(85),
    alertas: [],
    consultas: [consulta(80, "2026-01-01"), consulta(78, "2026-02-01")],
  });
  assert.equal(resultado.indicador, "efectiva");
  assert.equal(resultado.detalle.tendenciaPeso, "mejorando");
  assert.equal(resultado.detalle.deltaPesoKg, -2);
});

test("necesita_ajustes: alerta crítica pendiente fuerza el indicador aunque el resto sea bueno", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(90),
    alertas: [{ nivel: "critica", estado: "pendiente" }],
    consultas: [consulta(80, "2026-01-01"), consulta(78, "2026-02-01")],
  });
  assert.equal(resultado.indicador, "necesita_ajustes");
  assert.equal(resultado.detalle.alertasCriticasPendientes, 1);
  assert.ok(resultado.motivos.some((m) => m.includes("crítica")));
});

test("una alerta crítica ya resuelta no cuenta como pendiente", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(85),
    alertas: [{ nivel: "critica", estado: "aceptada" }],
    consultas: [consulta(80, "2026-01-01"), consulta(78, "2026-02-01")],
  });
  assert.equal(resultado.detalle.alertasCriticasPendientes, 0);
  assert.equal(resultado.indicador, "efectiva");
});

test("necesita_ajustes: cumplimiento bajo + peso retrocediendo respecto al objetivo, sin críticas", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(30),
    alertas: [],
    consultas: [consulta(78, "2026-01-01"), consulta(81, "2026-02-01")], // subió, objetivo era bajar
  });
  assert.equal(resultado.indicador, "necesita_ajustes");
  assert.equal(resultado.detalle.tendenciaPeso, "retrocediendo");
});

test("parcialmente_efectiva: señales mixtas sin llegar a ningún extremo", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(60),
    alertas: [],
    consultas: [consulta(80, "2026-01-01"), consulta(79.8, "2026-02-01")], // dentro de tolerancia
  });
  assert.equal(resultado.indicador, "parcialmente_efectiva");
  assert.equal(resultado.detalle.tendenciaPeso, "manteniendose");
});

test("objetivo subir: peso subiendo es mejorando, peso bajando es retrocediendo", () => {
  const mejorando = evaluar({
    paciente: pacienteSubir,
    resumenCumplimiento: resumen(70),
    alertas: [],
    consultas: [consulta(60, "2026-01-01"), consulta(62, "2026-02-01")],
  });
  assert.equal(mejorando.detalle.tendenciaPeso, "mejorando");

  const retrocediendo = evaluar({
    paciente: pacienteSubir,
    resumenCumplimiento: resumen(70),
    alertas: [],
    consultas: [consulta(62, "2026-01-01"), consulta(60, "2026-02-01")],
  });
  assert.equal(retrocediendo.detalle.tendenciaPeso, "retrocediendo");
});

test("objetivo mantener: dentro de tolerancia es manteniendose, fuera es cambio_notable", () => {
  const estable = evaluar({
    paciente: pacienteMantener,
    resumenCumplimiento: resumen(70),
    alertas: [],
    consultas: [consulta(70, "2026-01-01"), consulta(70.2, "2026-02-01")],
  });
  assert.equal(estable.detalle.tendenciaPeso, "manteniendose");

  const cambioNotable = evaluar({
    paciente: pacienteMantener,
    resumenCumplimiento: resumen(70),
    alertas: [],
    consultas: [consulta(70, "2026-01-01"), consulta(72, "2026-02-01")],
  });
  assert.equal(cambioNotable.detalle.tendenciaPeso, "cambio_notable");
});

test("compara la primera y la última consulta, no solo las dos últimas", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(70),
    alertas: [],
    consultas: [
      consulta(85, "2026-01-01"),
      consulta(82, "2026-02-01"),
      consulta(80, "2026-03-01"),
    ],
  });
  assert.equal(resultado.detalle.deltaPesoKg, -5);
});

test("cuenta alertas de advertencia pendientes por separado de las críticas", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(85),
    alertas: [
      { nivel: "advertencia", estado: "pendiente" },
      { nivel: "advertencia", estado: "pendiente" },
      { nivel: "informativa", estado: "pendiente" },
    ],
    consultas: [consulta(80, "2026-01-01"), consulta(78, "2026-02-01")],
  });
  assert.equal(resultado.detalle.alertasAdvertenciaPendientes, 2);
  assert.equal(resultado.detalle.alertasCriticasPendientes, 0);
});

test("solo hay datos de cumplimiento (sin consultas suficientes): igual evalúa, sin tendencia de peso", () => {
  const resultado = evaluar({
    paciente: pacienteBajar,
    resumenCumplimiento: resumen(90),
    alertas: [],
    consultas: [],
  });
  assert.notEqual(resultado.indicador, "informacion_insuficiente");
  assert.equal(resultado.detalle.tendenciaPeso, "sin_datos");
  assert.ok(resultado.motivos.some((m) => m.includes("Menos de 2 consultas")));
});

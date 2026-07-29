const test = require("node:test");
const assert = require("node:assert/strict");

const { calcularResumen } = require("../ResumenSeguimiento");

function registro(nivelCumplimiento) {
  return { nivelCumplimiento };
}

test("sin registros: totalRegistros 0 y porcentajeCumplimiento null", () => {
  const resumen = calcularResumen([]);
  assert.equal(resumen.totalRegistros, 0);
  assert.equal(resumen.porcentajeCumplimiento, null);
});

test("un solo registro 'bien' da 100%", () => {
  const resumen = calcularResumen([registro("bien")]);
  assert.equal(resumen.porcentajeCumplimiento, 100);
});

test("promedia los puntos de varios niveles", () => {
  const resumen = calcularResumen([registro("bien"), registro("regular"), registro("mal")]);
  assert.equal(resumen.totalRegistros, 3);
  assert.equal(resumen.porcentajeCumplimiento, 60); // (100+60+20)/3 = 60
});

test("redondea el porcentaje resultante", () => {
  const resumen = calcularResumen([registro("bien"), registro("regular")]);
  assert.equal(resumen.porcentajeCumplimiento, 80); // (100+60)/2 = 80
});

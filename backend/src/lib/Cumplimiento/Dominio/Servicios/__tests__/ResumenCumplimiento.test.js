const test = require("node:test");
const assert = require("node:assert/strict");

const { calcularResumen } = require("../ResumenCumplimiento");

function registro(overrides) {
  return {
    idDiaMenu: 1,
    comidasConsumidas: [],
    comidasOmitidas: [],
    sintomas: [],
    ...overrides,
  };
}

test("sin registros: totalRegistros 0 y porcentajeCumplimiento null", () => {
  const resumen = calcularResumen([], new Map());
  assert.equal(resumen.totalRegistros, 0);
  assert.equal(resumen.porcentajeCumplimiento, null);
  assert.deepEqual(resumen.sintomasReportados, []);
});

test("porcentajeCumplimiento: consumidas / planeadas de los días con registro", () => {
  const totalComidasPorDia = new Map([
    [1, 4],
    [2, 4],
  ]);
  const registros = [
    registro({ idDiaMenu: 1, comidasConsumidas: [10, 11, 12] }), // 3/4
    registro({ idDiaMenu: 2, comidasConsumidas: [20] }), // 1/4
  ];
  const resumen = calcularResumen(registros, totalComidasPorDia);
  assert.equal(resumen.totalComidasConsumidas, 4);
  assert.equal(resumen.totalComidasPlaneadas, 8);
  assert.equal(resumen.porcentajeCumplimiento, 50);
});

test("una comida no marcada ni consumida ni omitida cuenta como no consumida (conservador)", () => {
  const totalComidasPorDia = new Map([[1, 4]]);
  const registros = [registro({ idDiaMenu: 1, comidasConsumidas: [10], comidasOmitidas: [] })];
  const resumen = calcularResumen(registros, totalComidasPorDia);
  assert.equal(resumen.porcentajeCumplimiento, 25);
});

test("promedioAgua/promedioNivelHambre/promedioNivelEnergia: solo cuentan registros que reportaron el dato", () => {
  const totalComidasPorDia = new Map([[1, 1]]);
  const registros = [
    registro({ cantidadAgua: 2, nivelHambre: 3, nivelEnergia: 4 }),
    registro({ cantidadAgua: 4 }), // sin nivelHambre/nivelEnergia
  ];
  const resumen = calcularResumen(registros, totalComidasPorDia);
  assert.equal(resumen.promedioAgua, 3);
  assert.equal(resumen.promedioNivelHambre, 3);
  assert.equal(resumen.promedioNivelEnergia, 4);
});

test("sintomasReportados: unión sin duplicados de todos los registros", () => {
  const totalComidasPorDia = new Map([[1, 1]]);
  const registros = [
    registro({ sintomas: ["Dolor de cabeza", "Fatiga"] }),
    registro({ sintomas: ["Fatiga", "Náuseas"] }),
  ];
  const resumen = calcularResumen(registros, totalComidasPorDia);
  assert.deepEqual(resumen.sintomasReportados, ["Dolor de cabeza", "Fatiga", "Náuseas"]);
});

test("día sin entrada en totalComidasPorDia aporta 0 comidas planeadas", () => {
  const resumen = calcularResumen([registro({ idDiaMenu: 99, comidasConsumidas: [1] })], new Map());
  assert.equal(resumen.totalComidasPlaneadas, 0);
  assert.equal(resumen.porcentajeCumplimiento, null);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const DiaMenu = require("../Entidades/DiaMenu");
const { ValidationError } = require("../Errores");

const datosValidos = { idMenu: 1, numeroDia: 3, caloriasTotales: 1800 };

test("construye un DiaMenu válido", () => {
  const dia = new DiaMenu(datosValidos);
  assert.equal(dia.numeroDia, 3);
  assert.equal(dia.caloriasTotales, 1800);
});

test("rechaza numeroDia fuera de 1-7", () => {
  assert.throws(() => new DiaMenu({ ...datosValidos, numeroDia: 0 }), ValidationError);
  assert.throws(() => new DiaMenu({ ...datosValidos, numeroDia: 8 }), ValidationError);
});

test("rechaza caloriasTotales negativas o no numéricas", () => {
  assert.throws(() => new DiaMenu({ ...datosValidos, caloriasTotales: -1 }), ValidationError);
  assert.throws(() => new DiaMenu({ ...datosValidos, caloriasTotales: NaN }), ValidationError);
});

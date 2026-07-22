const test = require("node:test");
const assert = require("node:assert/strict");

const ComidaMenu = require("../Entidades/ComidaMenu");
const { ValidationError } = require("../Errores");

const datosValidos = { idDiaMenu: 1, orden: 1, tipoComida: "Desayuno", calorias: 450 };

test("construye una ComidaMenu válida", () => {
  const comida = new ComidaMenu(datosValidos);
  assert.equal(comida.tipoComida, "Desayuno");
});

test("rechaza orden no positivo", () => {
  assert.throws(() => new ComidaMenu({ ...datosValidos, orden: 0 }), ValidationError);
});

test("rechaza tipoComida vacío", () => {
  assert.throws(() => new ComidaMenu({ ...datosValidos, tipoComida: "  " }), ValidationError);
});

test("rechaza calorias negativas o no numéricas", () => {
  assert.throws(() => new ComidaMenu({ ...datosValidos, calorias: -1 }), ValidationError);
  assert.throws(() => new ComidaMenu({ ...datosValidos, calorias: Infinity }), ValidationError);
});

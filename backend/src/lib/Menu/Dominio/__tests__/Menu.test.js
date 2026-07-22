const test = require("node:test");
const assert = require("node:assert/strict");

const Menu = require("../Entidades/Menu");
const { ValidationError } = require("../Errores");

const datosValidos = {
  idPaciente: 1,
  estado: "generado",
  fechaGeneracion: new Date("2026-07-21"),
  fechaInicio: new Date("2026-07-21"),
  fechaFin: new Date("2026-07-27"),
};

test("construye un Menu válido", () => {
  const menu = new Menu(datosValidos);
  assert.equal(menu.idPaciente, 1);
  assert.equal(menu.estado, "generado");
});

test("rechaza estado fuera de generado/aprobado", () => {
  assert.throws(() => new Menu({ ...datosValidos, estado: "borrador" }), ValidationError);
});

test("rechaza idPaciente inválido", () => {
  assert.throws(() => new Menu({ ...datosValidos, idPaciente: 0 }), ValidationError);
});

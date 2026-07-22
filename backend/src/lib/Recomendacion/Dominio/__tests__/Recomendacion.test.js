const test = require("node:test");
const assert = require("node:assert/strict");

const Recomendacion = require("../Entidades/Recomendacion");
const { ValidationError } = require("../Errores");

const datosValidos = {
  idPaciente: 1,
  texto: "Aumentar consumo de proteína magra y fibra.",
  fechaGeneracion: new Date("2026-07-21"),
};

test("construye una Recomendacion válida", () => {
  const r = new Recomendacion(datosValidos);
  assert.equal(r.idPaciente, 1);
  assert.equal(r.texto, datosValidos.texto);
  assert.equal(r.fechaGeneracion, datosValidos.fechaGeneracion);
});

test("recorta espacios en texto (trim)", () => {
  const r = new Recomendacion({ ...datosValidos, texto: "  hola  " });
  assert.equal(r.texto, "hola");
});

test("rechaza idPaciente decimal o negativo", () => {
  assert.throws(() => new Recomendacion({ ...datosValidos, idPaciente: 1.5 }), ValidationError);
  assert.throws(() => new Recomendacion({ ...datosValidos, idPaciente: -1 }), ValidationError);
});

test("rechaza texto vacío o solo espacios", () => {
  assert.throws(() => new Recomendacion({ ...datosValidos, texto: "" }), ValidationError);
  assert.throws(() => new Recomendacion({ ...datosValidos, texto: "   " }), ValidationError);
});

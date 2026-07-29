const test = require("node:test");
const assert = require("node:assert/strict");

const RegistroSeguimiento = require("../RegistroSeguimiento");
const { ValidationError } = require("../../Errores");

const datosValidos = { idPaciente: 1, nivelCumplimiento: "bien" };

test("construye un RegistroSeguimiento válido solo con nivelCumplimiento", () => {
  const registro = new RegistroSeguimiento(datosValidos);
  assert.equal(registro.nivelCumplimiento, "bien");
  assert.equal(registro.peso, undefined);
  assert.ok(registro.fecha instanceof Date);
});

test("rechaza nivelCumplimiento faltante o inválido", () => {
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, nivelCumplimiento: undefined }), ValidationError);
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, nivelCumplimiento: "excelente" }), ValidationError);
});

test("acepta los 3 niveles válidos", () => {
  for (const nivel of ["bien", "regular", "mal"]) {
    const registro = new RegistroSeguimiento({ ...datosValidos, nivelCumplimiento: nivel });
    assert.equal(registro.nivelCumplimiento, nivel);
  }
});

test("rechaza idPaciente inválido", () => {
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, idPaciente: 0 }), ValidationError);
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, idPaciente: -1 }), ValidationError);
});

test("peso es opcional pero debe ser mayor a 0 si se envía", () => {
  const registro = new RegistroSeguimiento(datosValidos);
  assert.equal(registro.peso, undefined);
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, peso: 0 }), ValidationError);
  assert.throws(() => new RegistroSeguimiento({ ...datosValidos, peso: -5 }), ValidationError);
});

test("observaciones se recorta y es opcional", () => {
  const registro = new RegistroSeguimiento({ ...datosValidos, observaciones: "  Se siente con más energía  " });
  assert.equal(registro.observaciones, "Se siente con más energía");
  assert.equal(new RegistroSeguimiento(datosValidos).observaciones, undefined);
});

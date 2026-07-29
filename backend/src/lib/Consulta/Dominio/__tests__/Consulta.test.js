const test = require("node:test");
const assert = require("node:assert/strict");

const Consulta = require("../Entidades/Consulta");
const { ValidationError } = require("../Errores");

const datosValidos = { idPaciente: 1, peso: 70 };

test("construye una Consulta válida solo con peso", () => {
  const consulta = new Consulta(datosValidos);
  assert.equal(consulta.peso, 70);
  assert.ok(consulta.fecha instanceof Date);
});

test("rechaza peso faltante o inválido", () => {
  assert.throws(() => new Consulta({ ...datosValidos, peso: undefined }), ValidationError);
  assert.throws(() => new Consulta({ ...datosValidos, peso: 0 }), ValidationError);
  assert.throws(() => new Consulta({ ...datosValidos, peso: -5 }), ValidationError);
});

test("rechaza idPaciente inválido", () => {
  assert.throws(() => new Consulta({ ...datosValidos, idPaciente: 0 }), ValidationError);
  assert.throws(() => new Consulta({ ...datosValidos, idPaciente: -1 }), ValidationError);
});

test("porcentajeGrasaCorporal, masaMuscular, medidas, observaciones y resultados son opcionales", () => {
  const consulta = new Consulta(datosValidos);
  assert.equal(consulta.porcentajeGrasaCorporal, undefined);
  assert.equal(consulta.masaMuscular, undefined);
  assert.equal(consulta.medidas, undefined);
  assert.equal(consulta.observaciones, undefined);
  assert.equal(consulta.resultados, undefined);
});

test("acepta todos los campos opcionales completos", () => {
  const consulta = new Consulta({
    ...datosValidos,
    porcentajeGrasaCorporal: 22.5,
    masaMuscular: 30.2,
    medidas: { cintura: 80, cadera: 95, brazo: 30, muslo: 55, pecho: 100, cuello: 38 },
    observaciones: "  Paciente reporta más energía  ",
    resultados: "  Bajó 1.5kg desde la última consulta  ",
  });
  assert.equal(consulta.porcentajeGrasaCorporal, 22.5);
  assert.equal(consulta.masaMuscular, 30.2);
  assert.deepEqual(consulta.medidas, { cintura: 80, cadera: 95, brazo: 30, muslo: 55, pecho: 100, cuello: 38 });
  assert.equal(consulta.observaciones, "Paciente reporta más energía");
  assert.equal(consulta.resultados, "Bajó 1.5kg desde la última consulta");
});

test("acepta medidas parciales", () => {
  const consulta = new Consulta({ ...datosValidos, medidas: { cintura: 80 } });
  assert.deepEqual(consulta.medidas, { cintura: 80 });
});

test("rechaza porcentajeGrasaCorporal fuera de 0-100", () => {
  assert.throws(() => new Consulta({ ...datosValidos, porcentajeGrasaCorporal: -1 }), ValidationError);
  assert.throws(() => new Consulta({ ...datosValidos, porcentajeGrasaCorporal: 101 }), ValidationError);
});

test("rechaza masaMuscular negativa", () => {
  assert.throws(() => new Consulta({ ...datosValidos, masaMuscular: -1 }), ValidationError);
});

test("rechaza una medida corporal negativa", () => {
  assert.throws(() => new Consulta({ ...datosValidos, medidas: { cintura: -10 } }), ValidationError);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const RegistroCumplimiento = require("../RegistroCumplimiento");
const { ValidationError } = require("../../Errores");

const datosValidos = { idPaciente: 1, idMenu: 1, idDiaMenu: 1 };

test("construye un RegistroCumplimiento válido con solo los ids requeridos", () => {
  const registro = new RegistroCumplimiento(datosValidos);
  assert.equal(registro.idDiaMenu, 1);
  assert.deepEqual(registro.comidasConsumidas, []);
  assert.deepEqual(registro.comidasOmitidas, []);
  assert.deepEqual(registro.sintomas, []);
  assert.ok(registro.fecha instanceof Date);
});

test("rechaza idPaciente/idMenu/idDiaMenu inválidos", () => {
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, idPaciente: 0 }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, idMenu: -1 }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, idDiaMenu: "abc" }), ValidationError);
});

test("acepta comidasConsumidas y comidasOmitidas válidas", () => {
  const registro = new RegistroCumplimiento({
    ...datosValidos,
    comidasConsumidas: [1, 2],
    comidasOmitidas: [3],
  });
  assert.deepEqual(registro.comidasConsumidas, [1, 2]);
  assert.deepEqual(registro.comidasOmitidas, [3]);
});

test("rechaza que una comida esté consumida y omitida a la vez", () => {
  assert.throws(
    () => new RegistroCumplimiento({ ...datosValidos, comidasConsumidas: [1], comidasOmitidas: [1] }),
    ValidationError,
  );
});

test("rechaza comidasConsumidas/comidasOmitidas que no sean listas de ids positivos", () => {
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, comidasConsumidas: "no-lista" }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, comidasConsumidas: [0] }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, comidasConsumidas: [-1] }), ValidationError);
});

test("nivelHambre y nivelEnergia deben estar entre 1 y 5", () => {
  const registro = new RegistroCumplimiento({ ...datosValidos, nivelHambre: 3, nivelEnergia: 5 });
  assert.equal(registro.nivelHambre, 3);
  assert.equal(registro.nivelEnergia, 5);

  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, nivelHambre: 0 }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, nivelHambre: 6 }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, nivelEnergia: 2.5 }), ValidationError);
});

test("nivelHambre y nivelEnergia son opcionales", () => {
  const registro = new RegistroCumplimiento(datosValidos);
  assert.equal(registro.nivelHambre, undefined);
  assert.equal(registro.nivelEnergia, undefined);
});

test("rechaza cantidadAgua negativa y peso <= 0", () => {
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, cantidadAgua: -1 }), ValidationError);
  assert.throws(() => new RegistroCumplimiento({ ...datosValidos, peso: 0 }), ValidationError);
});

test("acepta y recorta texto libre (cambiosRealizados, actividadFisica, observaciones)", () => {
  const registro = new RegistroCumplimiento({
    ...datosValidos,
    cambiosRealizados: "  Sustituyó pollo por atún  ",
    actividadFisica: "  30 min de caminata  ",
    observaciones: "  Se sintió bien  ",
  });
  assert.equal(registro.cambiosRealizados, "Sustituyó pollo por atún");
  assert.equal(registro.actividadFisica, "30 min de caminata");
  assert.equal(registro.observaciones, "Se sintió bien");
});

test("sintomas: filtra vacíos y recorta espacios", () => {
  const registro = new RegistroCumplimiento({
    ...datosValidos,
    sintomas: ["  Dolor de cabeza  ", "", "  ", "Fatiga"],
  });
  assert.deepEqual(registro.sintomas, ["Dolor de cabeza", "Fatiga"]);
});

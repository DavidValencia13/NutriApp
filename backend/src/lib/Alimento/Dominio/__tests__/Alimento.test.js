const test = require("node:test");
const assert = require("node:assert/strict");

const Alimento = require("../Entidades/Alimento");
const { ValidationError } = require("../Errores");

const datosValidos = {
  idPaciente: 1,
  nombre: "Arroz",
  cantidad: 500,
  unidadMedida: "g",
};

test("construye un Alimento válido", () => {
  const alimento = new Alimento(datosValidos);
  assert.equal(alimento.idPaciente, 1);
  assert.equal(alimento.nombre, "Arroz");
  assert.equal(alimento.cantidad, 500);
  assert.equal(alimento.unidadMedida, "g");
});

test("recorta espacios en nombre y unidadMedida (trim)", () => {
  const alimento = new Alimento({
    ...datosValidos,
    nombre: "  Arroz  ",
    unidadMedida: "  g  ",
  });
  assert.equal(alimento.nombre, "Arroz");
  assert.equal(alimento.unidadMedida, "g");
});

test("rechaza idPaciente decimal", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, idPaciente: 1.5 }),
    ValidationError,
  );
});

test("rechaza idPaciente negativo", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, idPaciente: -1 }),
    ValidationError,
  );
});

test("rechaza idPaciente cero", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, idPaciente: 0 }),
    ValidationError,
  );
});

test("rechaza idPaciente faltante", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, idPaciente: undefined }),
    ValidationError,
  );
});

test("rechaza nombre vacío", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, nombre: "" }),
    ValidationError,
  );
});

test("rechaza nombre compuesto solo por espacios", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, nombre: "   " }),
    ValidationError,
  );
});

test("rechaza cantidad cero o negativa", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, cantidad: 0 }),
    ValidationError,
  );
  assert.throws(
    () => new Alimento({ ...datosValidos, cantidad: -5 }),
    ValidationError,
  );
});

test("rechaza cantidad NaN", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, cantidad: NaN }),
    ValidationError,
  );
});

test("rechaza cantidad Infinity", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, cantidad: Infinity }),
    ValidationError,
  );
});

test("rechaza unidadMedida vacía o solo espacios", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, unidadMedida: "" }),
    ValidationError,
  );
  assert.throws(
    () => new Alimento({ ...datosValidos, unidadMedida: "   " }),
    ValidationError,
  );
});

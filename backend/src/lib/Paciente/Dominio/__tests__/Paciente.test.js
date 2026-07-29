const test = require("node:test");
const assert = require("node:assert/strict");

const Paciente = require("../Entidades/Paciente");

const datosValidos = {
  idNutriologo: 10,
  nombre: "Juan",
  peso: 70,
  altura: 1.7,
  objetivo: "Bajar de peso",
  nivelActividad: "Moderado",
  numeroComidas: 3,
  presupuesto: 100,
  tiempoParaCocinar: 30,
};

test("construye un Paciente válido", () => {
  const paciente = new Paciente(datosValidos);
  assert.equal(paciente.nombre, "Juan");
  assert.equal(paciente.peso, 70);
});

test("por defecto, alergias y enfermedades son listas vacías", () => {
  const paciente = new Paciente(datosValidos);
  assert.deepEqual(paciente.alergias, []);
  assert.deepEqual(paciente.enfermedades, []);
});

test("acepta alergias y enfermedades", () => {
  const paciente = new Paciente({
    ...datosValidos,
    alergias: ["maní", "mariscos"],
    enfermedades: ["hipertensión"],
  });
  assert.deepEqual(paciente.alergias, ["maní", "mariscos"]);
  assert.deepEqual(paciente.enfermedades, ["hipertensión"]);
});

test("rechaza alergias que no sean una lista", () => {
  assert.throws(() => new Paciente({ ...datosValidos, alergias: "maní" }));
});

test("rechaza enfermedades que no sean una lista", () => {
  assert.throws(
    () => new Paciente({ ...datosValidos, enfermedades: "diabetes" }),
  );
});

test("si no se pasa pesoInicial, se autoasigna igual al peso actual", () => {
  const paciente = new Paciente(datosValidos);
  assert.equal(paciente.pesoInicial, 70);
});

test("respeta pesoInicial explícito cuando se pasa", () => {
  const paciente = new Paciente({ ...datosValidos, pesoInicial: 80 });
  assert.equal(paciente.pesoInicial, 80);
});

test("edad y sexo son opcionales", () => {
  const paciente = new Paciente(datosValidos);
  assert.equal(paciente.edad, undefined);
  assert.equal(paciente.sexo, undefined);
});

test("acepta edad y sexo válidos", () => {
  const paciente = new Paciente({ ...datosValidos, edad: 35, sexo: "femenino" });
  assert.equal(paciente.edad, 35);
  assert.equal(paciente.sexo, "femenino");
});

test("rechaza edad fuera de rango o no entera", () => {
  assert.throws(() => new Paciente({ ...datosValidos, edad: 0 }));
  assert.throws(() => new Paciente({ ...datosValidos, edad: 130 }));
  assert.throws(() => new Paciente({ ...datosValidos, edad: 35.5 }));
});

test("rechaza sexo fuera del enum", () => {
  assert.throws(() => new Paciente({ ...datosValidos, sexo: "x" }));
});

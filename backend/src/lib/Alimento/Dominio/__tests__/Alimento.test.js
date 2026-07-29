const test = require("node:test");
const assert = require("node:assert/strict");

const Alimento = require("../Entidades/Alimento");
const { ValidationError } = require("../Errores");

const datosValidos = {
  idPaciente: 1,
  nombre: "Arroz",
  cantidad: 500,
  unidadMedida: "g",
  gruposAlimenticios: ["carbohidratos"],
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

test("rechaza gruposAlimenticios faltante o vacío", () => {
  assert.throws(
    () => new Alimento({ ...datosValidos, gruposAlimenticios: undefined }),
    ValidationError,
  );
  assert.throws(
    () => new Alimento({ ...datosValidos, gruposAlimenticios: [] }),
    ValidationError,
  );
});

test("rechaza un grupo alimenticio fuera del enum", () => {
  assert.throws(
    () =>
      new Alimento({
        ...datosValidos,
        gruposAlimenticios: ["proteinas", "chatarra"],
      }),
    ValidationError,
  );
});

test("acepta un alimento en más de un grupo alimenticio", () => {
  const alimento = new Alimento({
    ...datosValidos,
    nombre: "Lentejas",
    gruposAlimenticios: ["legumbres", "proteinas"],
  });
  assert.deepEqual(alimento.gruposAlimenticios, ["legumbres", "proteinas"]);
});

test("construye un Alimento sin infoNutricional (opcional)", () => {
  const alimento = new Alimento(datosValidos);
  assert.equal(alimento.infoNutricional, undefined);
});

test("acepta infoNutricional parcial (por 100g, algunos nutrientes)", () => {
  const alimento = new Alimento({
    ...datosValidos,
    infoNutricional: { calorias: 130, proteinas: 2.7 },
  });
  assert.equal(alimento.infoNutricional.refCantidad, 100);
  assert.equal(alimento.infoNutricional.refUnidad, "g");
  assert.equal(alimento.infoNutricional.calorias, 130);
  assert.equal(alimento.infoNutricional.proteinas, 2.7);
});

test("acepta infoNutricional completo por porción con gramosPorPorcion", () => {
  const alimento = new Alimento({
    ...datosValidos,
    infoNutricional: {
      refUnidad: "porcion",
      refCantidad: 1,
      gramosPorPorcion: 150,
      calorias: 200,
      proteinas: 5,
      carbohidratos: 30,
      grasasTotales: 6,
      grasasSaturadas: 1,
      fibra: 3,
      azucares: 2,
      sodio: 100,
      potasio: 250,
      calcio: 40,
      hierro: 1.2,
      magnesio: 20,
      vitaminaA: 10,
      vitaminaC: 5,
      vitaminaD: 0,
      vitaminaB12: 0,
    },
  });
  assert.equal(alimento.infoNutricional.gramosPorPorcion, 150);
  assert.equal(alimento.infoNutricional.vitaminaB12, 0);
});

test("rechaza infoNutricional con refUnidad 'porcion' sin gramosPorPorcion", () => {
  assert.throws(
    () =>
      new Alimento({
        ...datosValidos,
        infoNutricional: { refUnidad: "porcion", calorias: 100 },
      }),
    ValidationError,
  );
});

test("rechaza infoNutricional con refUnidad inválida", () => {
  assert.throws(
    () =>
      new Alimento({
        ...datosValidos,
        infoNutricional: { refUnidad: "taza", calorias: 100 },
      }),
    ValidationError,
  );
});

test("rechaza un nutriente negativo en infoNutricional", () => {
  assert.throws(
    () =>
      new Alimento({
        ...datosValidos,
        infoNutricional: { proteinas: -1 },
      }),
    ValidationError,
  );
});

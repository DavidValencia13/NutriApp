const test = require("node:test");
const assert = require("node:assert/strict");

const {
  gramosEquivalentes,
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
} = require("../CalculadoraNutricional");

test("gramosEquivalentes: convierte g/kg/ml/l a gramos", () => {
  assert.equal(gramosEquivalentes(500, "g", null), 500);
  assert.equal(gramosEquivalentes(0.5, "kg", null), 500);
  assert.equal(gramosEquivalentes(250, "ml", null), 250);
  assert.equal(gramosEquivalentes(0.25, "l", null), 250);
});

test("cantidadEsPlausible: acepta cantidades razonables por unidad", () => {
  assert.equal(cantidadEsPlausible(150, "g"), true);
  assert.equal(cantidadEsPlausible(0.15, "kg"), true);
  assert.equal(cantidadEsPlausible(200, "ml"), true);
  assert.equal(cantidadEsPlausible(0.3, "l"), true);
  assert.equal(cantidadEsPlausible(0.5, "lb"), true);
  assert.equal(cantidadEsPlausible(2, "unidad"), true);
});

test("cantidadEsPlausible: rechaza cantidades fuera de escala (error típico de la IA: kg tratado como gramos)", () => {
  assert.equal(cantidadEsPlausible(150, "kg"), false); // 150 kg de un alimento en una sola comida
  assert.equal(cantidadEsPlausible(150, "l"), false);
  assert.equal(cantidadEsPlausible(50, "lb"), false);
  assert.equal(cantidadEsPlausible(5000, "g"), false);
  assert.equal(cantidadEsPlausible(100, "unidad"), false);
});

test("cantidadEsPlausible: rechaza cero, negativos y no numéricos", () => {
  assert.equal(cantidadEsPlausible(0, "g"), false);
  assert.equal(cantidadEsPlausible(-5, "g"), false);
  assert.equal(cantidadEsPlausible(NaN, "g"), false);
});

test("cantidadEsPlausible: no limita unidades de medida desconocidas", () => {
  assert.equal(cantidadEsPlausible(99999, "taza"), true);
});

test("gramosEquivalentes: 'unidad' solo convertible si refUnidad es 'porcion'", () => {
  assert.equal(
    gramosEquivalentes(2, "unidad", { refUnidad: "porcion", gramosPorPorcion: 180 }),
    360,
  );
  assert.equal(
    gramosEquivalentes(2, "unidad", { refUnidad: "g", refCantidad: 100 }),
    null,
  );
  assert.equal(gramosEquivalentes(2, "unidad", null), null);
});

test("gramosEquivalentes: unidad de medida desconocida devuelve null", () => {
  assert.equal(gramosEquivalentes(1, "taza", null), null);
});

const pollo100g = {
  unidadMedida: "g",
  infoNutricional: {
    refCantidad: 100,
    refUnidad: "g",
    calorias: 165,
    proteinas: 31,
    grasasTotales: 3.6,
  },
};

test("calcularNutrientesDetalle: escala por 100g correctamente", () => {
  const resultado = calcularNutrientesDetalle(pollo100g, 200); // 200g = factor 2
  assert.equal(resultado.nutrientes.calorias, 330);
  assert.equal(resultado.nutrientes.proteinas, 62);
  assert.equal(resultado.nutrientes.grasasTotales, 7.2);
  assert.equal(resultado.completo, false); // faltan los otros 13 campos
  assert.ok(resultado.camposFaltantes.includes("fibra"));
});

test("calcularNutrientesDetalle: alimento sin infoNutricional queda incompleto", () => {
  const resultado = calcularNutrientesDetalle(
    { unidadMedida: "g", infoNutricional: undefined },
    100,
  );
  assert.deepEqual(resultado.nutrientes, {});
  assert.equal(resultado.completo, false);
});

test("calcularNutrientesDetalle: unidad no convertible queda incompleto", () => {
  const alimento = {
    unidadMedida: "unidad",
    infoNutricional: { refCantidad: 100, refUnidad: "g", calorias: 50 },
  };
  const resultado = calcularNutrientesDetalle(alimento, 3);
  assert.deepEqual(resultado.nutrientes, {});
  assert.equal(resultado.completo, false);
});

test("calcularNutrientesDetalle: escala por porción correctamente", () => {
  const alimento = {
    unidadMedida: "unidad",
    infoNutricional: {
      refCantidad: 1,
      refUnidad: "porcion",
      gramosPorPorcion: 180,
      calorias: 95,
    },
  };
  // 2 unidades = 2 porciones = factor 2
  const resultado = calcularNutrientesDetalle(alimento, 2);
  assert.equal(resultado.nutrientes.calorias, 190);
});

test("sumarNutrientes: suma campo por campo y agrega camposFaltantes", () => {
  const a = { nutrientes: { calorias: 100, proteinas: 10 }, completo: false, camposFaltantes: ["fibra"] };
  const b = { nutrientes: { calorias: 50 }, completo: false, camposFaltantes: ["proteinas"] };
  const total = sumarNutrientes([a, b]);
  assert.equal(total.nutrientes.calorias, 150);
  assert.equal(total.nutrientes.proteinas, 10);
  assert.equal(total.completo, false);
  assert.deepEqual(total.camposFaltantes.sort(), ["fibra", "proteinas"]);
});

test("sumarNutrientes: completo=true solo si todos los elementos son completos", () => {
  const completo = { nutrientes: { calorias: 100 }, completo: true, camposFaltantes: [] };
  const total = sumarNutrientes([completo, completo]);
  assert.equal(total.completo, true);
});

test("sumarNutrientes: lista vacía no se considera completa", () => {
  const total = sumarNutrientes([]);
  assert.equal(total.completo, false);
  assert.deepEqual(total.nutrientes, {});
});

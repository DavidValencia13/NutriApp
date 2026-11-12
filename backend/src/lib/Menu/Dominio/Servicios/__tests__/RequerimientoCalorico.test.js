const test = require("node:test");
const assert = require("node:assert/strict");

const { requerimientoCalorico, repartoPorComida } = require("../RequerimientoCalorico");
const {
  caloriasDeComida,
  momentosDelDia,
  calcularNutrientesDetalle,
} = require("../CalculadoraNutricional");

test("Mifflin-St Jeor × actividad ± objetivo (mujer, moderada, bajar de peso)", () => {
  // reposo = 10·65 + 6.25·165 − 5·26 − 161 = 1390.25; × 1.55 = 2154.9; − 500 = 1654.9
  assert.equal(
    requerimientoCalorico({ peso: 65, altura: 1.65, edad: 26, sexo: "femenino", nivelActividad: "Moderado", objetivo: "Bajar Peso" }),
    1650,
  );
});

test("nunca baja del mínimo seguro y devuelve null sin peso o altura", () => {
  assert.equal(
    requerimientoCalorico({ peso: 40, altura: 1.45, edad: 70, sexo: "femenino", nivelActividad: "Sedentario", objetivo: "Bajar de peso" }),
    1200,
  );
  assert.equal(requerimientoCalorico({ altura: 1.7 }), null);
});

test("reparte la meta diaria según los momentos del día", () => {
  const reparto = repartoPorComida(2000, ["Desayuno", "Almuerzo", "Merienda", "Cena"]);
  assert.deepEqual(reparto.map((r) => r.momento), ["Desayuno", "Almuerzo", "Merienda", "Cena"]);
  assert.ok(reparto.find((r) => r.momento === "Almuerzo").calorias > reparto.find((r) => r.momento === "Merienda").calorias);
});

test("los momentos del día dependen de cuántas comidas hace el paciente (una sola merienda, en la tarde)", () => {
  assert.deepEqual(momentosDelDia(4), ["Desayuno", "Almuerzo", "Merienda", "Cena"]);
  assert.deepEqual(momentosDelDia(5), ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"]);
  assert.equal(momentosDelDia(5).filter((m) => m === "Merienda").length, 1);
});

test("un alimento por unidad se calcula con el peso de una pieza aunque la tabla venga por 100 g", () => {
  const manzana = {
    unidadMedida: "unidad",
    infoNutricional: { refUnidad: "g", refCantidad: 100, gramosPorPorcion: 180, calorias: 52, proteinas: 0.3, carbohidratos: 14, grasasTotales: 0.2 },
  };
  const r = calcularNutrientesDetalle(manzana, 1);
  assert.equal(Math.round(r.nutrientes.calorias), 94); // 52 × 1.8
  assert.equal(r.completo, true); // sin azúcares/magnesio/vitamina D sigue completo
});

test("las calorías de la comida son las calculadas; la estimación solo si falta el dato", () => {
  assert.equal(caloriasDeComida({ nutrientes: { calorias: 412.6 }, completo: true, camposFaltantes: [] }, 999), 413);
  assert.equal(caloriasDeComida({ nutrientes: {}, completo: false, camposFaltantes: ["calorias"] }, 450), 450);
});

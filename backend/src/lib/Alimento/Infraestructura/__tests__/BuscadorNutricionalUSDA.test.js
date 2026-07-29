const test = require("node:test");
const assert = require("node:assert/strict");

const BuscadorNutricionalUSDA = require("../BuscadorNutricionalUSDA");
const { ServicioExternoError } = require("../../Dominio/Errores");

process.env.USDA_FDC_API_KEY = "clave-de-prueba";

function pedirCompletionFalso(nombreIngles) {
  return async () => JSON.stringify({ nombreIngles });
}

function fetchFalso({ ok = true, status = 200, body = {} }) {
  return async () => ({
    ok,
    status,
    json: async () => body,
  });
}

test("devuelve null si USDA no encuentra resultados", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("chicken breast"),
    fetchFalso({ body: { foods: [] } }),
  );
  const resultado = await buscador.buscar("pechuga de pollo");
  assert.equal(resultado, null);
});

test("mapea los nutrientes conocidos y descarta los desconocidos", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("chicken breast"),
    fetchFalso({
      body: {
        foods: [
          {
            description: "Chicken, breast, raw",
            foodNutrients: [
              { nutrientName: "Energy", value: 165, unitName: "KCAL" },
              { nutrientName: "Protein", value: 31, unitName: "G" },
              { nutrientName: "Nutriente Desconocido X", value: 999 },
            ],
          },
        ],
      },
    }),
  );
  const resultado = await buscador.buscar("pechuga de pollo");
  assert.equal(resultado.nombreEncontrado, "Chicken, breast, raw");
  assert.equal(resultado.refUnidad, "g");
  assert.equal(resultado.refCantidad, 100);
  assert.equal(resultado.calorias, 165);
  assert.equal(resultado.proteinas, 31);
  assert.equal("Nutriente Desconocido X" in resultado, false);
});

test("si la traducción falla, busca igual con el nombre original", async () => {
  const pedirCompletionQueFalla = async () => "esto no es JSON válido";
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionQueFalla,
    fetchFalso({ body: { foods: [] } }),
  );
  // No debe lanzar por la traducción fallida, solo devolver null (sin resultados)
  const resultado = await buscador.buscar("manzana");
  assert.equal(resultado, null);
});

test("lanza ServicioExternoError si USDA responde con error", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("apple"),
    fetchFalso({ ok: false, status: 500 }),
  );
  await assert.rejects(
    () => buscador.buscar("manzana"),
    ServicioExternoError,
  );
});

test("lanza ServicioExternoError si falta la API key", async () => {
  const original = process.env.USDA_FDC_API_KEY;
  delete process.env.USDA_FDC_API_KEY;
  try {
    const buscador = new BuscadorNutricionalUSDA(
      pedirCompletionFalso("apple"),
      fetchFalso({ body: { foods: [] } }),
    );
    await assert.rejects(
      () => buscador.buscar("manzana"),
      ServicioExternoError,
    );
  } finally {
    process.env.USDA_FDC_API_KEY = original;
  }
});

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
              { nutrientName: "Total Sugars", value: 0, unitName: "G" },
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
  assert.equal(resultado.azucares, 0);
  assert.equal(resultado.tipoMedicion, "peso");
  assert.equal("Nutriente Desconocido X" in resultado, false);
});

test("busca leche con un término preciso y la identifica como líquido", async () => {
  let consultaUsda;
  const buscador = new BuscadorNutricionalUSDA(
    async () => {
      throw new Error("no debe traducir una búsqueda conocida");
    },
    async (url) => {
      consultaUsda = new URL(url).searchParams.get("query");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          foods: [
            {
              description:
                "Milk, whole, 3.25% milkfat, with added vitamin D",
              foodNutrients: [
                { nutrientName: "Energy", value: 61, unitName: "KCAL" },
                { nutrientName: "Calcium, Ca", value: 113, unitName: "MG" },
              ],
            },
          ],
        }),
      };
    },
  );

  const resultado = await buscador.buscar("Leche");

  assert.equal(consultaUsda, "milk, whole, 3.25% milkfat");
  assert.equal(
    resultado.nombreEncontrado,
    "Milk, whole, 3.25% milkfat, with added vitamin D",
  );
  assert.equal(resultado.tipoMedicion, "volumen");
  assert.equal(resultado.calorias, 61);
  assert.equal(resultado.calcio, 113);
});

test("reconoce las variantes de nombre que USDA usa para azúcares", () => {
  const buscador = new BuscadorNutricionalUSDA(pedirCompletionFalso("beans"));

  for (const nutrientName of [
    "Sugars, total",
    "Sugars, total including NLEA",
    "Total Sugars",
    "Sugars, Total",
  ]) {
    const resultado = buscador._mapearAInfoNutricional({
      foodNutrients: [{ nutrientName, value: 0.35, unitName: "G" }],
    });
    assert.equal(resultado.azucares, 0.35);
  }
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

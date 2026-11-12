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

test("si la traducción falla no busca en español: lanza ServicioExternoError", async () => {
  let consultoUsda = false;
  const buscador = new BuscadorNutricionalUSDA(
    async () => "esto no es JSON válido",
    async () => { consultoUsda = true; return { ok: true, status: 200, json: async () => ({ foods: [] }) }; },
  );
  await assert.rejects(() => buscador.buscar("papa"), ServicioExternoError);
  assert.equal(consultoUsda, false);
});

test("elige el alimento básico aunque USDA lo ponga más abajo en la lista", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("Apples, raw, with skin"),
    fetchFalso({
      body: {
        foods: [
          { description: "Croissants, apple", foodNutrients: [{ nutrientName: "Energy", value: 254, unitName: "KCAL" }] },
          { description: "Apples, dried, sulfured, uncooked", foodNutrients: [{ nutrientName: "Energy", value: 243, unitName: "KCAL" }] },
          { description: "Apples, fuji, with skin, raw", foodNutrients: [{ nutrientName: "Energy", value: 64.7, unitName: "KCAL" }] },
        ],
      },
    }),
  );
  const resultado = await buscador.buscar("manzana");
  assert.equal(resultado.nombreEncontrado, "Apples, fuji, with skin, raw");
});

test("respeta una búsqueda precisa (atún en agua, no en aceite)", async () => {
  const { elegirMejorResultado } = BuscadorNutricionalUSDA;
  const foods = [
    { description: "Fish, tuna, light, canned in oil, drained solids", foodNutrients: [] },
    { description: "Fish, tuna, light, canned in water, drained solids", foodNutrients: [] },
  ];
  assert.equal(
    elegirMejorResultado("tuna, canned in water, drained", foods).description,
    "Fish, tuna, light, canned in water, drained solids",
  );
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

test("toma la energía en kcal aunque USDA la mande primero en kJ", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("lupins"),
    fetchFalso({
      body: {
        foods: [
          {
            description: "Lupins, mature seeds, raw",
            foodNutrients: [
              { nutrientName: "Energy", value: 1550, unitName: "kJ" },
              { nutrientName: "Energy", value: 371, unitName: "KCAL" },
            ],
          },
        ],
      },
    }),
  );
  const resultado = await buscador.buscar("chocho");
  assert.equal(resultado.calorias, 371);
  assert.equal(resultado.fuente, "USDA");
});

test("acepta la energía de los alimentos Foundation (Atwater)", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    pedirCompletionFalso("rice, white"),
    fetchFalso({
      body: {
        foods: [
          {
            description: "Rice, white, puffed",
            foodNutrients: [
              { nutrientName: "Energy (Atwater General Factors)", value: 371, unitName: "KCAL" },
            ],
          },
        ],
      },
    }),
  );
  const resultado = await buscador.buscar("arroz blanco");
  assert.equal(resultado.calorias, 371);
});

test("devuelve null si ningún resultado es el alimento buscado (no adivina)", () => {
  const { elegirMejorResultado } = BuscadorNutricionalUSDA;
  const foods = [
    { description: "Tree fern, cooked, with salt", foodNutrients: [] },
    { description: "Tomatoes, grape, raw", foodNutrients: [] },
    { description: "Abiyuch, raw", foodNutrients: [] },
  ];
  assert.equal(elegirMejorResultado("Tree tomato, raw", foods), null);
});

test("prefiere las palabras del alimento al inicio (Oil, olive antes que la mezcla)", () => {
  const { elegirMejorResultado } = BuscadorNutricionalUSDA;
  const energia = [{ nutrientName: "Energy", value: 884, unitName: "KCAL" }];
  const foods = [
    { description: "Oil, corn, peanut, and olive", foodNutrients: energia },
    { description: "Oil, olive, salad or cooking", foodNutrients: energia },
  ];
  assert.equal(elegirMejorResultado("Olive oil", foods).description, "Oil, olive, salad or cooking");
});

test("los descriptores no le ganan a la palabra del alimento (naranja no es camote)", () => {
  const { elegirMejorResultado } = BuscadorNutricionalUSDA;
  const energia = [{ nutrientName: "Energy", value: 50, unitName: "KCAL" }];
  const foods = [
    { description: "Sweet potatoes, orange flesh, without skin, raw", foodNutrients: energia },
    { description: "Oranges, raw, Florida", foodNutrients: energia },
  ];
  assert.equal(elegirMejorResultado("Orange, sweet, raw", foods).description, "Oranges, raw, Florida");
});

test("devuelve el peso típico de una unidad que estimó la IA al traducir", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    async () => JSON.stringify({ nombreIngles: "Apples, raw, with skin", gramosPorUnidad: 180 }),
    fetchFalso({
      body: { foods: [{ description: "Apples, fuji, with skin, raw", foodNutrients: [{ nutrientName: "Energy", value: 64.7, unitName: "KCAL" }] }] },
    }),
  );
  const resultado = await buscador.buscar("manzana");
  assert.equal(resultado.gramosPorUnidad, 180);
});

test("si la IA dice que no se vende por piezas (null), no inventa un peso", async () => {
  const buscador = new BuscadorNutricionalUSDA(
    async () => JSON.stringify({ nombreIngles: "Rice, white, long-grain, regular, raw", gramosPorUnidad: null }),
    fetchFalso({
      body: { foods: [{ description: "Rice, white, long-grain, regular, raw, enriched", foodNutrients: [{ nutrientName: "Energy", value: 365, unitName: "KCAL" }] }] },
    }),
  );
  assert.equal((await buscador.buscar("arroz")).gramosPorUnidad, undefined);
});

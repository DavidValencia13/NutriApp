const test = require("node:test");
const assert = require("node:assert/strict");
const NutriologoController = require("../NutriologoController");

function respuesta() {
  return { body: null, json(body) { this.body = body; return this; } };
}

test("el contacto se lee y actualiza usando el id del token, no uno enviado en el cuerpo", async () => {
  const ids = [];
  const controller = new NutriologoController({
    obtenerNutriologo: { ejecutar: async (id) => { ids.push(id); return { whatsappNumero: "593978959229" }; } },
    actualizarWhatsappNutriologo: { ejecutar: async (id, numero) => { ids.push(id); return { numero }; } },
  });
  const req = { nutriologo: { id: 7 }, body: { idNutriologo: 8, numero: "593978959229" } };
  const res = respuesta();
  await controller.obtenerWhatsapp(req, res, (error) => { throw error; });
  assert.deepEqual(res.body, { numero: "593978959229" });
  await controller.actualizarWhatsapp(req, res, (error) => { throw error; });
  assert.deepEqual(ids, [7, 7]);
});

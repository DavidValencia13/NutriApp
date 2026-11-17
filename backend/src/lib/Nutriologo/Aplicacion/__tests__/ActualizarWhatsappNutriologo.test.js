const test = require("node:test");
const assert = require("node:assert/strict");
const { ActualizarWhatsappNutriologo, validarNumero } = require("../ActualizarWhatsappNutriologo");

test("normaliza un móvil ecuatoriano al formato que usa WhatsApp", async () => {
  let guardado;
  const caso = new ActualizarWhatsappNutriologo({ updateById: async (id, datos) => {
    guardado = { id, ...datos };
    return datos;
  } });
  assert.deepEqual(await caso.ejecutar(7, "0978959229"), { numero: "593978959229" });
  assert.deepEqual(guardado, { id: 7, whatsappNumero: "593978959229" });
  assert.equal(validarNumero("+593 978 959 229"), "593978959229");
});

test("rechaza números inválidos sin escribir en la cuenta", async () => {
  let escrituras = 0;
  const caso = new ActualizarWhatsappNutriologo({ updateById: async () => { escrituras++; } });
  await assert.rejects(() => caso.ejecutar(7, "javascript:alert(1)"), { statusCode: 400 });
  await assert.rejects(() => caso.ejecutar(7, "0988"), { statusCode: 400 });
  assert.equal(escrituras, 0);
});

test("permite quitar un número de la cuenta", async () => {
  const caso = new ActualizarWhatsappNutriologo({ updateById: async (id, datos) => datos });
  assert.deepEqual(await caso.ejecutar(7, ""), { numero: null });
});

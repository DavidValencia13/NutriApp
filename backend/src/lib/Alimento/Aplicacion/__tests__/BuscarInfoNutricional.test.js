const test = require("node:test");
const assert = require("node:assert/strict");

const BuscarInfoNutricional = require("../BuscarInfoNutricional");
const { ValidationError } = require("../../Dominio/Errores");

test("rechaza nombre vacío", async () => {
  const caso = new BuscarInfoNutricional({ buscar: async () => null });
  await assert.rejects(() => caso.ejecutar(""), ValidationError);
  await assert.rejects(() => caso.ejecutar("   "), ValidationError);
  await assert.rejects(() => caso.ejecutar(undefined), ValidationError);
});

test("delega en el buscador inyectado y devuelve su resultado", async () => {
  const resultadoEsperado = { calorias: 100 };
  const buscadorFalso = { buscar: async (nombre) => resultadoEsperado };
  const caso = new BuscarInfoNutricional(buscadorFalso);
  const resultado = await caso.ejecutar("manzana");
  assert.equal(resultado, resultadoEsperado);
});

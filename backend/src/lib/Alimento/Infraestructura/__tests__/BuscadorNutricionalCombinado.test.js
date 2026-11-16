const test = require("node:test");
const assert = require("node:assert/strict");

const BuscadorNutricionalCombinado = require("../BuscadorNutricionalCombinado");
const { ServicioExternoError } = require("../../Dominio/Errores");

const USDA = { fuente: "USDA", nombreEncontrado: "Lupins, mature seeds, cooked", calorias: 119 };
const USFQ = { fuente: "USFQ", nombreEncontrado: "Chocho, cocido, sin sal", calorias: 128.08 };

const devuelve = (valor) => ({ buscar: async () => valor });
const falla = (error) => ({ buscar: async () => { throw error; } });

// Las fallas se registran con console.error; se silencian en estos tests
test.beforeEach(() => { test.mock.method(console, "error", () => {}); });
test.afterEach(() => { test.mock.restoreAll(); });

test("si ambas encuentran, usa la principal y ofrece la otra como alternativa", async () => {
  const b = new BuscadorNutricionalCombinado({ principal: devuelve(USDA), secundario: devuelve(USFQ) });
  const r = await b.buscar("chocho");
  assert.equal(r.fuente, "USDA");
  assert.deepEqual(r.alternativa, USFQ);
});

test("una referencia ecuatoriana exacta usa USFQ y deja USDA como alternativa", async () => {
  const b = new BuscadorNutricionalCombinado({ principal: devuelve(USDA), secundario: devuelve(USFQ) });
  const r = await b.buscar("Chocho, cocido, sin sal");
  assert.equal(r.fuente, "USFQ");
  assert.deepEqual(r.alternativa, USDA);
});

test("si la principal no encuentra, usa la secundaria sin alternativa", async () => {
  const b = new BuscadorNutricionalCombinado({ principal: devuelve(null), secundario: devuelve(USFQ) });
  assert.deepEqual(await b.buscar("chocho"), USFQ);
});

test("si la principal falla, usa la secundaria", async () => {
  const b = new BuscadorNutricionalCombinado({
    principal: falla(new ServicioExternoError("USDA no respondió", 504)),
    secundario: devuelve(USFQ),
  });
  assert.deepEqual(await b.buscar("chocho"), USFQ);
});

test("si la secundaria falla, igual devuelve la principal", async () => {
  const b = new BuscadorNutricionalCombinado({ principal: devuelve(USDA), secundario: falla(new Error("Mongo caído")) });
  assert.deepEqual(await b.buscar("chocho"), USDA);
});

test("devuelve null si ninguna encuentra el alimento", async () => {
  const b = new BuscadorNutricionalCombinado({ principal: devuelve(null), secundario: devuelve(null) });
  assert.equal(await b.buscar("xyz"), null);
});

test("si las dos fallan, propaga la falla del servicio externo", async () => {
  const error = new ServicioExternoError("USDA no respondió", 504);
  const b = new BuscadorNutricionalCombinado({ principal: falla(error), secundario: falla(new Error("Mongo caído")) });
  await assert.rejects(() => b.buscar("chocho"), error);
});

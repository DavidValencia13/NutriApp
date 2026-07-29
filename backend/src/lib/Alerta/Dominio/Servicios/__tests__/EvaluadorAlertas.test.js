const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizar, slug, ajusteObjetivo } = require("../EvaluadorAlertas");

test("normalizar: minúsculas, sin tildes, sin espacios sobrantes", () => {
  assert.equal(normalizar("  Maní Salado  "), "mani salado");
  assert.equal(normalizar(undefined), "");
});

test("slug: convierte a snake_case sin acentos", () => {
  assert.equal(slug("Mantequilla de Maní"), "mantequilla_de_mani");
  assert.equal(slug("  Sin gluten  "), "sin_gluten");
});

test("ajusteObjetivo: -500 para bajar, +500 para subir, 0 para mantener", () => {
  assert.equal(ajusteObjetivo("Bajar de peso"), -500);
  assert.equal(ajusteObjetivo("Subir masa muscular"), 500);
  assert.equal(ajusteObjetivo("Mantener peso"), 0);
});

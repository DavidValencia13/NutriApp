const test = require("node:test");
const assert = require("node:assert/strict");

const { PersonalizarMarca, normalizarMarca } = require("../PersonalizarMarca");

const LOGO = "data:image/png;base64,iVBORw0KGgo=";

function repoFalso() {
  const fila = { id: 1, marca: null };
  return {
    fila,
    async findById(id) { return id === 1 ? fila : null; },
    async updateById(id, datos) {
      if (id !== 1) return null;
      Object.assign(fila, datos);
      return fila;
    },
  };
}

test("normaliza el nombre y valida color y logo", () => {
  assert.deepEqual(normalizarMarca({ nombreConsulta: "  Nutri   Vida ", color: "azul", logo: LOGO }), {
    nombreConsulta: "Nutri Vida", color: "azul", logo: LOGO,
  });
  assert.deepEqual(normalizarMarca({}), { nombreConsulta: null, color: null, logo: null });
  assert.throws(() => normalizarMarca({ color: "#ff0000" }), /paleta/);
  assert.throws(() => normalizarMarca({ logo: "data:image/svg+xml;base64,PHN2Zz4=" }), /PNG, JPG o WebP/);
  assert.throws(() => normalizarMarca({ logo: "javascript:alert(1)" }), /PNG, JPG o WebP/);
  assert.throws(() => normalizarMarca({ logo: `data:image/png;base64,${"A".repeat(95000)}` }), /pesado/);
  assert.throws(() => normalizarMarca({ nombreConsulta: "x".repeat(61) }), /60/);
});

test("guarda, devuelve y se puede volver al diseño original", async () => {
  const repo = repoFalso();
  const caso = new PersonalizarMarca(repo);
  assert.deepEqual(await caso.obtener(1), { nombreConsulta: null, color: null, logo: null });

  const guardada = await caso.guardar(1, { nombreConsulta: "Consultorio Sánchez", color: "morado" });
  assert.equal(guardada.color, "morado");
  assert.equal(repo.fila.marca.nombreConsulta, "Consultorio Sánchez");

  await caso.guardar(1, {});
  assert.equal(repo.fila.marca, null); // todo vacío = diseño original de NutriApp
  await assert.rejects(() => caso.guardar(2, {}), /no encontrado/);
});

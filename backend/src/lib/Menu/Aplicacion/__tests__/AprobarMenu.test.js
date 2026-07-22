const test = require("node:test");
const assert = require("node:assert/strict");

const AprobarMenu = require("../AprobarMenu");
const { NotFoundError } = require("../../Dominio/Errores");

test("lanza NotFoundError si el menú no existe o no es del nutriólogo", async () => {
  const caso = new AprobarMenu({
    async obtenerMenuConPropietario() { return null; },
    async aprobar() { throw new Error("no debería llamarse"); },
  });
  await assert.rejects(() => caso.ejecutar(1, 10), NotFoundError);
});

test("si ya está aprobado, es no-op (no llama a aprobar)", async () => {
  let llamadasAprobar = 0;
  const menuAprobado = { id: 1, estado: "aprobado" };
  const caso = new AprobarMenu({
    async obtenerMenuConPropietario() { return menuAprobado; },
    async aprobar() { llamadasAprobar++; return null; },
  });
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado, menuAprobado);
  assert.equal(llamadasAprobar, 0);
});

test("transiciona generado -> aprobado", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const menuAprobado = { id: 1, estado: "aprobado" };
  const caso = new AprobarMenu({
    async obtenerMenuConPropietario() { return menuGenerado; },
    async aprobar() { return menuAprobado; },
  });
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado, menuAprobado);
});

test("si el repositorio pierde la carrera (aprobar devuelve null), responde con el estado actual", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  let llamadas = 0;
  const caso = new AprobarMenu({
    async obtenerMenuConPropietario() {
      llamadas++;
      return llamadas === 1 ? menuGenerado : { id: 1, estado: "aprobado" };
    },
    async aprobar() { return null; }, // perdió la carrera
  });
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.estado, "aprobado");
});

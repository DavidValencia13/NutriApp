const test = require("node:test");
const assert = require("node:assert/strict");

const AprobarMenu = require("../AprobarMenu");
const { NotFoundError } = require("../../Dominio/Errores");

function crearDependencias({ menu, aprobarResultado } = {}) {
  const menuRepository = {
    llamadasAprobar: 0,
    async obtenerMenuConPropietario() {
      return this.llamadasAprobar === 0 ? menu : (aprobarResultado ?? { ...menu, estado: "aprobado" });
    },
    async aprobar() {
      this.llamadasAprobar++;
      return aprobarResultado !== undefined ? aprobarResultado : { ...menu, estado: "aprobado" };
    },
  };

  return { menuRepository };
}

test("lanza NotFoundError si el menú no existe o no es del nutriólogo", async () => {
  const deps = crearDependencias({ menu: null });
  const caso = new AprobarMenu(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), NotFoundError);
});

test("si ya está aprobado, es no-op (no llama a aprobar)", async () => {
  const menuAprobado = { id: 1, estado: "aprobado" };
  const deps = crearDependencias({ menu: menuAprobado });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu, menuAprobado);
  assert.equal(deps.menuRepository.llamadasAprobar, 0);
});

test("transiciona generado -> aprobado directo, sin ninguna validación previa", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const deps = crearDependencias({ menu: menuGenerado });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu.estado, "aprobado");
  assert.equal(deps.menuRepository.llamadasAprobar, 1);
});

test("si el repositorio pierde la carrera (aprobar devuelve null), responde con el estado actual", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const deps = crearDependencias({ menu: menuGenerado, aprobarResultado: null });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu.estado, "aprobado");
});

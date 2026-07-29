const test = require("node:test");
const assert = require("node:assert/strict");

const AprobarMenu = require("../AprobarMenu");
const { NotFoundError, AlertasCriticasError } = require("../../Dominio/Errores");

function crearDependencias({ menu, aprobarResultado, alertas = [] } = {}) {
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

  const generarAlertas = {
    llamadas: 0,
    async ejecutar() {
      this.llamadas++;
      return alertas;
    },
  };

  return { menuRepository, generarAlertas };
}

test("lanza NotFoundError si el menú no existe o no es del nutriólogo", async () => {
  const deps = crearDependencias({ menu: null });
  const caso = new AprobarMenu(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), NotFoundError);
});

test("si ya está aprobado, es no-op (no llama a aprobar ni a generarAlertas)", async () => {
  const menuAprobado = { id: 1, estado: "aprobado" };
  const deps = crearDependencias({ menu: menuAprobado });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu, menuAprobado);
  assert.equal(resultado.requiereConfirmacion, false);
  assert.equal(deps.generarAlertas.llamadas, 0);
});

test("transiciona generado -> aprobado cuando no hay alertas pendientes bloqueantes", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const deps = crearDependencias({ menu: menuGenerado });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu.estado, "aprobado");
  assert.equal(resultado.requiereConfirmacion, false);
});

test("bloquea con AlertasCriticasError si hay una alerta crítica pendiente", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const alertas = [{ id: 1, nivel: "critica", estado: "pendiente", mensaje: "x" }];
  const deps = crearDependencias({ menu: menuGenerado, alertas });
  const caso = new AprobarMenu(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), AlertasCriticasError);
  assert.equal(deps.menuRepository.llamadasAprobar, 0);
});

test("no bloquea por una alerta crítica ya resuelta", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const alertas = [{ id: 1, nivel: "critica", estado: "aceptada", mensaje: "x" }];
  const deps = crearDependencias({ menu: menuGenerado, alertas });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu.estado, "aprobado");
});

test("advertencia pendiente sin confirmar: no aprueba, pide confirmación", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const alertas = [{ id: 2, nivel: "advertencia", estado: "pendiente", mensaje: "sodio alto" }];
  const deps = crearDependencias({ menu: menuGenerado, alertas });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10, { confirmarAdvertencias: false });
  assert.equal(resultado.requiereConfirmacion, true);
  assert.equal(resultado.advertencias.length, 1);
  assert.equal(deps.menuRepository.llamadasAprobar, 0);
});

test("advertencia pendiente con confirmarAdvertencias:true: aprueba", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const alertas = [{ id: 2, nivel: "advertencia", estado: "pendiente", mensaje: "sodio alto" }];
  const deps = crearDependencias({ menu: menuGenerado, alertas });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10, { confirmarAdvertencias: true });
  assert.equal(resultado.requiereConfirmacion, false);
  assert.equal(resultado.menu.estado, "aprobado");
});

test("si el repositorio pierde la carrera (aprobar devuelve null), responde con el estado actual", async () => {
  const menuGenerado = { id: 1, estado: "generado" };
  const deps = crearDependencias({ menu: menuGenerado, aprobarResultado: null });
  const caso = new AprobarMenu(deps);
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado.menu.estado, "aprobado");
});

const test = require("node:test");
const assert = require("node:assert/strict");

const MenuController = require("../MenuController");
const { NotFoundError } = require("../../../Dominio/Errores");

function respuesta() {
  return {
    statusCode: 200,
    status(codigo) { this.statusCode = codigo; return this; },
    json(cuerpo) { this.body = cuerpo; return this; },
  };
}

const solicitud = { idPaciente: 7, nutriologo: { id: 3 } };

test("generar exige confirmación explícita y referencia a la versión vista", async () => {
  let opciones;
  const controller = new MenuController({
    generarMenuSemanal: { async ejecutar(_paciente, _nutriologo, recibidas) { opciones = recibidas; return { id: 9 }; } },
  });
  const res = respuesta();
  await controller.generar({ ...solicitud, body: { confirmarNuevaVersion: "true", idVersionActual: 8 } }, res, () => {});
  assert.deepEqual(opciones, { confirmarNuevaVersion: false, idVersionActual: 8 });
  assert.equal(res.statusCode, 201);
  await controller.generar({ ...solicitud, body: { confirmarNuevaVersion: true, idVersionActual: 8 } }, res, () => {});
  assert.equal(opciones.confirmarNuevaVersion, true);
});

test("historial devuelve metadatos sin modificar las versiones", async () => {
  const versiones = [{ id: 9, estado: "generado" }];
  const controller = new MenuController({
    obtenerMenuPorPaciente: { async listarHistorial() { return versiones; } },
  });
  const res = respuesta();
  await controller.historial(solicitud, res, () => {});
  assert.equal(res.body, versiones);
});

test("una versión ajena devuelve 404 sin filtrar sus datos", async () => {
  const controller = new MenuController({
    obtenerMenuPorPaciente: { async obtenerVersion() { throw new NotFoundError("Menú no encontrado"); } },
  });
  const res = respuesta();
  await controller.obtenerVersion({ ...solicitud, params: { idMenu: "12" } }, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: "Menú no encontrado" });
});

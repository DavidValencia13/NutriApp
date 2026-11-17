const test = require("node:test");
const assert = require("node:assert/strict");

const SeguimientoController = require("../SeguimientoController");
const { NotFoundError, ValidationError } = require("../../../Dominio/Errores");

function respuesta() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

test("PUT actualiza solo el control del paciente verificado por middleware", async () => {
  const llamadas = [];
  const controller = new SeguimientoController({
    actualizarSeguimiento: {
      async ejecutar(id, idPaciente, body) {
        llamadas.push({ id, idPaciente, body });
        return { id, idPaciente, peso: body.peso };
      },
    },
  });
  const res = respuesta();
  await controller.actualizar({ params: { id: "5" }, idPaciente: 7, body: { peso: 65, idPaciente: 99 } }, res, () => {});
  assert.deepEqual(llamadas, [{ id: 5, idPaciente: 7, body: { peso: 65, idPaciente: 99 } }]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.idPaciente, 7);
});

test("PUT devuelve 400 para un id inválido y 404 si no pertenece al paciente", async () => {
  const controller = new SeguimientoController({
    actualizarSeguimiento: { async ejecutar() { throw new NotFoundError("Registro de seguimiento no encontrado"); } },
  });
  const invalido = respuesta();
  await controller.actualizar({ params: { id: "abc" }, idPaciente: 7, body: {} }, invalido, () => {});
  assert.equal(invalido.statusCode, 400);

  const ajeno = respuesta();
  await controller.actualizar({ params: { id: "5" }, idPaciente: 7, body: {} }, ajeno, () => {});
  assert.equal(ajeno.statusCode, 404);
});

test("PUT devuelve 400 si el peso o el cumplimiento no son válidos", async () => {
  const controller = new SeguimientoController({
    actualizarSeguimiento: { async ejecutar() { throw new ValidationError("Datos inválidos"); } },
  });
  const res = respuesta();
  await controller.actualizar({ params: { id: "5" }, idPaciente: 7, body: {} }, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Datos inválidos");
});

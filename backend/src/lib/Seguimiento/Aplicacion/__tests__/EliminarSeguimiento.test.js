const test = require("node:test");
const assert = require("node:assert/strict");

const EliminarSeguimiento = require("../EliminarSeguimiento");
const { NotFoundError } = require("../../Dominio/Errores");

function crearRepoFalso(existente) {
  return {
    llamadasEliminar: [],
    async findByIdAndPaciente(id, idPaciente) {
      if (!existente) return null;
      if (existente.id !== id || existente.idPaciente !== idPaciente) return null;
      return existente;
    },
    async eliminar(id, idPaciente) {
      this.llamadasEliminar.push({ id, idPaciente });
      return existente;
    },
  };
}

const registroExistente = { id: 5, idPaciente: 1, nivelCumplimiento: "bien" };

test("lanza NotFoundError si el registro no existe para ese paciente", async () => {
  const repo = crearRepoFalso(null);
  const caso = new EliminarSeguimiento(repo);
  await assert.rejects(() => caso.ejecutar(5, 1), NotFoundError);
});

test("lanza NotFoundError si el registro existe pero es de otro paciente", async () => {
  const repo = crearRepoFalso(registroExistente);
  const caso = new EliminarSeguimiento(repo);
  await assert.rejects(() => caso.ejecutar(5, 2), NotFoundError);
});

test("elimina el registro cuando existe y pertenece al paciente", async () => {
  const repo = crearRepoFalso(registroExistente);
  const caso = new EliminarSeguimiento(repo);
  await caso.ejecutar(5, 1);
  assert.deepEqual(repo.llamadasEliminar, [{ id: 5, idPaciente: 1 }]);
});

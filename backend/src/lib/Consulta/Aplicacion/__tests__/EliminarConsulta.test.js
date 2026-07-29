const test = require("node:test");
const assert = require("node:assert/strict");

const EliminarConsulta = require("../EliminarConsulta");
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

const consultaExistente = { id: 5, idPaciente: 1, peso: 70 };

test("lanza NotFoundError si la consulta no existe para ese paciente", async () => {
  const repo = crearRepoFalso(null);
  const caso = new EliminarConsulta(repo);
  await assert.rejects(() => caso.ejecutar(5, 1), NotFoundError);
});

test("lanza NotFoundError si la consulta existe pero es de otro paciente", async () => {
  const repo = crearRepoFalso(consultaExistente);
  const caso = new EliminarConsulta(repo);
  await assert.rejects(() => caso.ejecutar(5, 2), NotFoundError);
});

test("elimina la consulta cuando existe y pertenece al paciente", async () => {
  const repo = crearRepoFalso(consultaExistente);
  const caso = new EliminarConsulta(repo);
  await caso.ejecutar(5, 1);
  assert.deepEqual(repo.llamadasEliminar, [{ id: 5, idPaciente: 1 }]);
});

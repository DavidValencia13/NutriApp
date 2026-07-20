const test = require("node:test");
const assert = require("node:assert/strict");

const EliminarAlimento = require("../EliminarAlimento");
const { NotFoundError } = require("../../Dominio/Errores");

function crearRepoFalso(existente) {
  return {
    llamadasDelete: [],
    async findByIdAndPaciente(id, idPaciente) {
      if (!existente) return null;
      if (existente.id !== id || existente.idPaciente !== idPaciente)
        return null;
      return existente;
    },
    async deleteByIdAndPaciente(id, idPaciente) {
      this.llamadasDelete.push({ id, idPaciente });
      return existente;
    },
  };
}

const alimentoExistente = { id: "abc123", idPaciente: 1, nombre: "Arroz" };

test("lanza NotFoundError si el alimento no existe", async () => {
  const repo = crearRepoFalso(null);
  const caso = new EliminarAlimento(repo);

  await assert.rejects(() => caso.ejecutar("abc123", 1), NotFoundError);
});

test("lanza NotFoundError si el alimento es de otro paciente", async () => {
  const repo = crearRepoFalso(alimentoExistente);
  const caso = new EliminarAlimento(repo);

  await assert.rejects(() => caso.ejecutar("abc123", 2), NotFoundError);
  assert.equal(repo.llamadasDelete.length, 0);
});

test("llama a deleteByIdAndPaciente(id, idPaciente) cuando el alimento existe y le pertenece", async () => {
  const repo = crearRepoFalso(alimentoExistente);
  const caso = new EliminarAlimento(repo);

  await caso.ejecutar("abc123", 1);

  assert.equal(repo.llamadasDelete.length, 1);
  assert.deepEqual(repo.llamadasDelete[0], { id: "abc123", idPaciente: 1 });
});

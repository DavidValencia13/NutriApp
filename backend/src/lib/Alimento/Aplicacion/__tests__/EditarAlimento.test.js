const test = require("node:test");
const assert = require("node:assert/strict");

const EditarAlimento = require("../EditarAlimento");
const { ValidationError, NotFoundError } = require("../../Dominio/Errores");

function crearRepoFalso(existente) {
  return {
    llamadasUpdate: [],
    async findByIdAndPaciente(id, idPaciente) {
      if (!existente) return null;
      if (existente.id !== id || existente.idPaciente !== idPaciente)
        return null;
      return existente;
    },
    async updateByIdAndPaciente(id, idPaciente, cambios) {
      this.llamadasUpdate.push({ id, idPaciente, cambios });
      return { ...existente, ...cambios, id, idPaciente };
    },
  };
}

const alimentoExistente = {
  id: "abc123",
  idPaciente: 1,
  nombre: "Arroz",
  cantidad: 500,
  unidadMedida: "g",
};

test("lanza NotFoundError si el alimento no existe para ese paciente", async () => {
  const repo = crearRepoFalso(null);
  const caso = new EditarAlimento(repo);

  await assert.rejects(
    () => caso.ejecutar("abc123", 1, { nombre: "Papa" }),
    NotFoundError,
  );
});

test("lanza NotFoundError si el alimento existe pero es de otro paciente", async () => {
  const repo = crearRepoFalso(alimentoExistente);
  const caso = new EditarAlimento(repo);

  // idPaciente distinto al del alimento existente (2 vs 1)
  await assert.rejects(
    () => caso.ejecutar("abc123", 2, { nombre: "Papa" }),
    NotFoundError,
  );
});

test("revalida el estado resultante del merge y rechaza datos inválidos", async () => {
  const repo = crearRepoFalso(alimentoExistente);
  const caso = new EditarAlimento(repo);

  await assert.rejects(
    () => caso.ejecutar("abc123", 1, { cantidad: -10 }),
    ValidationError,
  );
  assert.equal(repo.llamadasUpdate.length, 0);
});

test("llama a updateByIdAndPaciente con (id, idPaciente, cambios) solo con campos de negocio", async () => {
  const repo = crearRepoFalso(alimentoExistente);
  const caso = new EditarAlimento(repo);

  await caso.ejecutar("abc123", 1, { nombre: "Papa" });

  assert.equal(repo.llamadasUpdate.length, 1);
  const llamada = repo.llamadasUpdate[0];
  assert.equal(llamada.id, "abc123");
  assert.equal(llamada.idPaciente, 1);
  assert.deepEqual(Object.keys(llamada.cambios).sort(), [
    "cantidad",
    "nombre",
    "unidadMedida",
  ]);
  assert.equal(llamada.cambios.nombre, "Papa");
});

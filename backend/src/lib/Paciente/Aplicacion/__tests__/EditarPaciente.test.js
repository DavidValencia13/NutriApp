const test = require("node:test");
const assert = require("node:assert/strict");

const EditarPaciente = require("../EditarPaciente");

function crearRepoFalso(existente) {
  return {
    llamadasUpdate: [],
    async findById(id) {
      if (!existente || existente.id !== id) return null;
      return existente;
    },
    async updateById(id, cambios) {
      this.llamadasUpdate.push({ id, cambios });
      return { ...existente, ...cambios, id };
    },
  };
}

const pacienteExistente = {
  id: 1,
  idNutriologo: 10,
  nombre: "Juan",
  peso: 70,
  altura: 1.7,
  objetivo: "Bajar de peso",
  nivelActividad: "Moderado",
  numeroComidas: 3,
  presupuesto: 100,
  tiempoParaCocinar: 30,
  restricciones: "",
  preferencias: "",
};

test("lanza error si el paciente no existe", async () => {
  const repo = crearRepoFalso(null);
  const caso = new EditarPaciente(repo);

  await assert.rejects(() => caso.ejecutar(1, 10, { nombre: "Pedro" }));
});

test("lanza error si el paciente pertenece a otro nutriólogo", async () => {
  const repo = crearRepoFalso(pacienteExistente);
  const caso = new EditarPaciente(repo);

  await assert.rejects(() => caso.ejecutar(1, 999, { nombre: "Pedro" }));
  assert.equal(repo.llamadasUpdate.length, 0);
});

test("revalida el estado resultante del merge y rechaza datos inválidos", async () => {
  const repo = crearRepoFalso(pacienteExistente);
  const caso = new EditarPaciente(repo);

  await assert.rejects(() => caso.ejecutar(1, 10, { peso: -5 }));
  assert.equal(repo.llamadasUpdate.length, 0);
});

test("ignora idNutriologo del body: no permite reasignar el paciente a otro nutriólogo", async () => {
  const repo = crearRepoFalso(pacienteExistente);
  const caso = new EditarPaciente(repo);

  await caso.ejecutar(1, 10, { nombre: "Pedro", idNutriologo: 999 });

  assert.equal(repo.llamadasUpdate.length, 1);
  assert.equal(repo.llamadasUpdate[0].cambios.idNutriologo, undefined);
});

test("llama a updateById con el estado completo revalidado (nunca id/idNutriologo)", async () => {
  const repo = crearRepoFalso(pacienteExistente);
  const caso = new EditarPaciente(repo);

  await caso.ejecutar(1, 10, { nombre: "Pedro" });

  assert.equal(repo.llamadasUpdate.length, 1);
  const llamada = repo.llamadasUpdate[0];
  assert.equal(llamada.id, 1);
  assert.deepEqual(Object.keys(llamada.cambios).sort(), [
    "altura",
    "nivelActividad",
    "nombre",
    "numeroComidas",
    "objetivo",
    "peso",
    "preferencias",
    "presupuesto",
    "restricciones",
    "tiempoParaCocinar",
  ]);
  assert.equal(llamada.cambios.nombre, "Pedro");
});

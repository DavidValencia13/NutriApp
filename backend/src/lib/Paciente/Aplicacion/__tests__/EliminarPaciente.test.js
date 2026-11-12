const test = require("node:test");
const assert = require("node:assert/strict");

const EliminarPaciente = require("../EliminarPaciente");

function repoPacienteFalso(paciente) {
  const llamadas = [];
  return {
    llamadas,
    findById: async () => paciente,
    deleteById: async (id) => { llamadas.push(["paciente", id]); return paciente; },
  };
}

const repoAsociado = (nombre, llamadas) => ({
  eliminarPorPaciente: async (id) => { llamadas.push([nombre, id]); },
});

test("borra los datos asociados del paciente antes de borrarlo", async () => {
  const repo = repoPacienteFalso({ id: 5, idNutriologo: 1 });
  const caso = new EliminarPaciente(repo, [
    repoAsociado("alimentos", repo.llamadas),
    repoAsociado("seguimiento", repo.llamadas),
  ]);
  await caso.ejecutar(5, 1);
  assert.deepEqual(repo.llamadas, [["alimentos", 5], ["seguimiento", 5], ["paciente", 5]]);
});

test("no borra nada si el paciente es de otro nutriólogo", async () => {
  const repo = repoPacienteFalso({ id: 5, idNutriologo: 2 });
  const caso = new EliminarPaciente(repo, [repoAsociado("alimentos", repo.llamadas)]);
  await assert.rejects(() => caso.ejecutar(5, 1), /No autorizado/);
  assert.deepEqual(repo.llamadas, []);
});

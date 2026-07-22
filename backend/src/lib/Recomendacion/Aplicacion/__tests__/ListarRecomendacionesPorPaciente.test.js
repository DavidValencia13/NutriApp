const test = require("node:test");
const assert = require("node:assert/strict");

const ListarRecomendacionesPorPaciente = require("../ListarRecomendacionesPorPaciente");

function crearPacienteRepoFalso(paciente) {
  return { async findById() { return paciente; } };
}

test("lanza error si el paciente no existe", async () => {
  const caso = new ListarRecomendacionesPorPaciente(
    crearPacienteRepoFalso(null),
    { async listarPorPaciente() { return []; } },
  );
  await assert.rejects(() => caso.ejecutar(1, 10));
});

test("lanza error si el paciente pertenece a otro nutriólogo", async () => {
  const caso = new ListarRecomendacionesPorPaciente(
    crearPacienteRepoFalso({ id: 1, idNutriologo: 999 }),
    { async listarPorPaciente() { return []; } },
  );
  await assert.rejects(() => caso.ejecutar(1, 10));
});

test("delega en el repositorio de recomendaciones", async () => {
  const recomendaciones = [{ id: 1, texto: "x" }];
  const caso = new ListarRecomendacionesPorPaciente(
    crearPacienteRepoFalso({ id: 1, idNutriologo: 10 }),
    { async listarPorPaciente(idPaciente) { assert.equal(idPaciente, 1); return recomendaciones; } },
  );
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado, recomendaciones);
});

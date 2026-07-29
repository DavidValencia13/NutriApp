const test = require("node:test");
const assert = require("node:assert/strict");

const ListarSeguimientoPorPaciente = require("../ListarSeguimientoPorPaciente");

test("delega en el repositorio con el idPaciente recibido", async () => {
  const registrosFalsos = [{ id: 1 }, { id: 2 }];
  const repo = {
    llamadas: [],
    async listarPorPaciente(idPaciente) {
      this.llamadas.push(idPaciente);
      return registrosFalsos;
    },
  };
  const caso = new ListarSeguimientoPorPaciente(repo);

  const resultado = await caso.ejecutar(7);

  assert.deepEqual(repo.llamadas, [7]);
  assert.equal(resultado, registrosFalsos);
});

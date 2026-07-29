const test = require("node:test");
const assert = require("node:assert/strict");

const ListarConsultasPorPaciente = require("../ListarConsultasPorPaciente");

test("delega en el repositorio con el idPaciente recibido", async () => {
  const consultasFalsas = [{ id: 1 }, { id: 2 }];
  const repo = {
    llamadas: [],
    async listarPorPaciente(idPaciente) {
      this.llamadas.push(idPaciente);
      return consultasFalsas;
    },
  };
  const caso = new ListarConsultasPorPaciente(repo);

  const resultado = await caso.ejecutar(7);

  assert.deepEqual(repo.llamadas, [7]);
  assert.equal(resultado, consultasFalsas);
});

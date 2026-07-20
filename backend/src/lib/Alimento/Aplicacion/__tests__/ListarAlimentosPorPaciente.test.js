const test = require("node:test");
const assert = require("node:assert/strict");

const ListarAlimentosPorPaciente = require("../ListarAlimentosPorPaciente");

test("delega en findAllByPaciente con el idPaciente recibido", async () => {
  const alimentosDelPaciente = [
    { id: "1", idPaciente: 1, nombre: "Arroz" },
    { id: "2", idPaciente: 1, nombre: "Pollo" },
  ];
  const repo = {
    llamadas: [],
    async findAllByPaciente(idPaciente) {
      this.llamadas.push(idPaciente);
      return alimentosDelPaciente;
    },
  };
  const caso = new ListarAlimentosPorPaciente(repo);

  const resultado = await caso.ejecutar(1);

  assert.deepEqual(repo.llamadas, [1]);
  assert.equal(resultado, alimentosDelPaciente);
});

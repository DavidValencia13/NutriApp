const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarConsulta = require("../RegistrarConsulta");
const { ValidationError } = require("../../Dominio/Errores");

function crearRepoFalso() {
  return {
    guardadas: [],
    async crear(consulta) {
      this.guardadas.push(consulta);
      return { ...consulta, id: 1 };
    },
  };
}

test("guarda una consulta válida y devuelve el resultado del repositorio", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarConsulta(repo);

  const resultado = await caso.ejecutar({ idPaciente: 1, peso: 70 });

  assert.equal(repo.guardadas.length, 1);
  assert.equal(repo.guardadas[0].peso, 70);
  assert.equal(resultado.id, 1);
});

test("no guarda si el peso es inválido", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarConsulta(repo);

  await assert.rejects(() => caso.ejecutar({ idPaciente: 1, peso: -5 }), ValidationError);
  assert.equal(repo.guardadas.length, 0);
});

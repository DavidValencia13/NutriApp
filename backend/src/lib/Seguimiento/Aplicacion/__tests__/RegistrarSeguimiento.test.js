const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarSeguimiento = require("../RegistrarSeguimiento");
const { ValidationError } = require("../../Dominio/Errores");

function crearRepoFalso() {
  return {
    guardados: [],
    async crear(registro) {
      this.guardados.push(registro);
      return { ...registro, id: 1 };
    },
  };
}

test("guarda un registro válido y devuelve el resultado del repositorio", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarSeguimiento(repo);

  const resultado = await caso.ejecutar({ idPaciente: 1, nivelCumplimiento: "bien" });

  assert.equal(repo.guardados.length, 1);
  assert.equal(repo.guardados[0].nivelCumplimiento, "bien");
  assert.equal(resultado.id, 1);
});

test("no guarda si el nivelCumplimiento es inválido", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarSeguimiento(repo);

  await assert.rejects(
    () => caso.ejecutar({ idPaciente: 1, nivelCumplimiento: "excelente" }),
    ValidationError,
  );
  assert.equal(repo.guardados.length, 0);
});

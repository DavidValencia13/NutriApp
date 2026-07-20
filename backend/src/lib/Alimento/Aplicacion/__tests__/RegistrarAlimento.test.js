const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarAlimento = require("../RegistrarAlimento");
const { ValidationError } = require("../../Dominio/Errores");

function crearRepoFalso() {
  return {
    guardados: [],
    async save(alimento) {
      this.guardados.push(alimento);
      return { ...alimento, id: "id-generado" };
    },
  };
}

test("guarda un alimento válido y devuelve el resultado del repositorio", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarAlimento(repo);

  const resultado = await caso.ejecutar({
    idPaciente: 1,
    nombre: "Arroz",
    cantidad: 500,
    unidadMedida: "g",
  });

  assert.equal(repo.guardados.length, 1);
  assert.equal(repo.guardados[0].nombre, "Arroz");
  assert.equal(resultado.id, "id-generado");
});

test("no guarda si los datos son inválidos", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarAlimento(repo);

  await assert.rejects(
    () =>
      caso.ejecutar({
        idPaciente: 1,
        nombre: "",
        cantidad: 500,
        unidadMedida: "g",
      }),
    ValidationError,
  );
  assert.equal(repo.guardados.length, 0);
});

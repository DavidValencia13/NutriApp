const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarAlimento = require("../RegistrarAlimento");
const { ValidationError } = require("../../Dominio/Errores");

function crearRepoFalso() {
  return {
    guardados: [],
    duplicado: null,
    async findByNombreAndPaciente() {
      return this.duplicado;
    },
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
    gruposAlimenticios: ["carbohidratos"],
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

test("rechaza un nombre duplicado para el mismo paciente", async () => {
  const repo = crearRepoFalso();
  repo.duplicado = { id: "existente", nombre: "Arroz", idPaciente: 1 };
  const caso = new RegistrarAlimento(repo);

  await assert.rejects(
    () =>
      caso.ejecutar({
        idPaciente: 1,
        nombre: " arroz ",
        cantidad: 500,
        unidadMedida: "g",
        gruposAlimenticios: ["carbohidratos"],
      }),
    (error) =>
      error.statusCode === 409 &&
      error.message.includes("ya está registrado"),
  );
  assert.equal(repo.guardados.length, 0);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const ActualizarSeguimiento = require("../ActualizarSeguimiento");
const { NotFoundError, ValidationError } = require("../../Dominio/Errores");

const existente = {
  id: 5,
  idPaciente: 7,
  fecha: new Date("2026-11-17T23:59:59.000Z"),
  peso: 63,
  nivelCumplimiento: "bien",
  observaciones: "Control inicial",
};

function crearRepo() {
  return {
    actualizaciones: [],
    async findByIdAndPaciente(id, idPaciente) {
      return id === existente.id && idPaciente === existente.idPaciente ? existente : null;
    },
    async actualizar(id, idPaciente, registro) {
      this.actualizaciones.push({ id, idPaciente, registro });
      return registro;
    },
  };
}

test("edita el control propio sin cambiar su fecha ni crear otro", async () => {
  const repo = crearRepo();
  const caso = new ActualizarSeguimiento(repo);
  const actualizado = await caso.ejecutar(5, 7, {
    peso: 65,
    nivelCumplimiento: "regular",
    observaciones: "Valor corregido",
    fecha: "2026-11-18",
    idPaciente: 99,
  });

  assert.equal(repo.actualizaciones.length, 1);
  assert.equal(actualizado.peso, 65);
  assert.equal(actualizado.idPaciente, 7);
  assert.equal(actualizado.fecha, existente.fecha);
  assert.equal(actualizado.observaciones, "Valor corregido");
});

test("rechaza editar un control de otro paciente", async () => {
  const repo = crearRepo();
  await assert.rejects(
    () => new ActualizarSeguimiento(repo).ejecutar(5, 8, { peso: 65, nivelCumplimiento: "bien" }),
    NotFoundError,
  );
  assert.equal(repo.actualizaciones.length, 0);
});

test("rechaza peso y cumplimiento inválidos antes de actualizar", async () => {
  const repo = crearRepo();
  const caso = new ActualizarSeguimiento(repo);
  await assert.rejects(() => caso.ejecutar(5, 7, { peso: -1, nivelCumplimiento: "bien" }), ValidationError);
  await assert.rejects(() => caso.ejecutar(5, 7, { nivelCumplimiento: "bien" }), ValidationError);
  await assert.rejects(() => caso.ejecutar(5, 7, { peso: 65, nivelCumplimiento: "invalido" }), ValidationError);
  await assert.rejects(() => caso.ejecutar(5, 7, { peso: 65, nivelCumplimiento: "bien", observaciones: {} }), ValidationError);
  assert.equal(repo.actualizaciones.length, 0);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const ObtenerMenuPorPaciente = require("../ObtenerMenuPorPaciente");
const { NotFoundError, ValidationError } = require("../../Dominio/Errores");

test("lanza error si el paciente no existe o no es del nutriólogo", async () => {
  const caso = new ObtenerMenuPorPaciente(
    { async findById() { return null; } },
    { async obtenerMasRecientePorPaciente() { return null; } },
  );
  await assert.rejects(() => caso.ejecutar(1, 10));
});

test("delega en menuRepository.obtenerMasRecientePorPaciente", async () => {
  const menuFalso = { id: 1 };
  const caso = new ObtenerMenuPorPaciente(
    { async findById() { return { id: 1, idNutriologo: 10 }; } },
    { async obtenerMasRecientePorPaciente(idPaciente) { assert.equal(idPaciente, 1); return menuFalso; } },
  );
  const resultado = await caso.ejecutar(1, 10);
  assert.equal(resultado, menuFalso);
});

test("historial distingue última propuesta y menú visible para el paciente", async () => {
  const caso = new ObtenerMenuPorPaciente(
    { async findById() { return { id: 1, idNutriologo: 10 }; } },
    { async listarVersionesPorPaciente() { return [
      { id: 3, estado: "generado" },
      { id: 2, estado: "aprobado" },
      { id: 1, estado: "aprobado" },
    ]; } },
  );
  const historial = await caso.listarHistorial(1, 10);
  assert.deepEqual(historial.map(({ esUltimaVersion, visibleParaPaciente }) => [esUltimaVersion, visibleParaPaciente]), [
    [true, false], [false, true], [false, false],
  ]);
});

test("no entrega una versión de otro paciente aunque conozcan su id", async () => {
  const caso = new ObtenerMenuPorPaciente(
    { async findById() { return { id: 1, idNutriologo: 10 }; } },
    { async obtenerConDetallesPorId() { return { id: 7, idPaciente: 2 }; } },
  );
  await assert.rejects(() => caso.obtenerVersion(1, 7, 10), NotFoundError);
  await assert.rejects(() => caso.obtenerVersion(1, "abc", 10), ValidationError);
});

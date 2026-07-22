const test = require("node:test");
const assert = require("node:assert/strict");

const ObtenerMenuPorPaciente = require("../ObtenerMenuPorPaciente");

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

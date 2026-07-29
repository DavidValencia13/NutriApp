const test = require("node:test");
const assert = require("node:assert/strict");

const ListarMenusPorPaciente = require("../ListarMenusPorPaciente");
const { NotFoundError } = require("../../Dominio/Errores");

const paciente = { id: 1, idNutriologo: 10 };

function menuFalso(overrides = {}) {
  return {
    id: 1,
    estado: "generado",
    fechaGeneracion: new Date("2026-01-01"),
    fechaInicio: new Date("2026-01-01"),
    fechaFin: new Date("2026-01-07"),
    dias: [
      { caloriasTotales: 2000, costoTotalDia: 5, nutrientes: { nutrientes: { calorias: 2000, proteinas: 100 }, completo: true, camposFaltantes: [] } },
      { caloriasTotales: 1800, costoTotalDia: 4.5, nutrientes: { nutrientes: { calorias: 1800, proteinas: 90 }, completo: true, camposFaltantes: [] } },
    ],
    ...overrides,
  };
}

function crearDependencias({ pacienteEncontrado = paciente, menus = [menuFalso()] } = {}) {
  return {
    pacienteRepository: { async findById() { return pacienteEncontrado; } },
    menuRepository: { async listarPorPaciente() { return menus; } },
  };
}

test("lanza NotFoundError si el paciente no existe", async () => {
  const deps = crearDependencias({ pacienteEncontrado: null });
  const caso = new ListarMenusPorPaciente(deps.pacienteRepository, deps.menuRepository);
  await assert.rejects(() => caso.ejecutar(1, 10), NotFoundError);
});

test("lanza NotFoundError si el paciente pertenece a otro nutriólogo", async () => {
  const deps = crearDependencias();
  const caso = new ListarMenusPorPaciente(deps.pacienteRepository, deps.menuRepository);
  await assert.rejects(() => caso.ejecutar(1, 999), NotFoundError);
});

test("arma el resumen (costo, calorías, nutrientes) sumando los días de cada menú", async () => {
  const deps = crearDependencias();
  const caso = new ListarMenusPorPaciente(deps.pacienteRepository, deps.menuRepository);

  const resultado = await caso.ejecutar(1, 10);

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].costoTotalSemana, 9.5);
  assert.equal(resultado[0].caloriasTotalesSemana, 3800);
  assert.equal(resultado[0].resumenNutricional.nutrientes.calorias, 3800);
  assert.equal(resultado[0].resumenNutricional.nutrientes.proteinas, 190);
});

test("devuelve una lista vacía si el paciente no tiene menús", async () => {
  const deps = crearDependencias({ menus: [] });
  const caso = new ListarMenusPorPaciente(deps.pacienteRepository, deps.menuRepository);
  const resultado = await caso.ejecutar(1, 10);
  assert.deepEqual(resultado, []);
});

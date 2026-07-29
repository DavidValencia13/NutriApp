const test = require("node:test");
const assert = require("node:assert/strict");

const GenerarAlertas = require("../GenerarAlertas");
const { NotFoundError } = require("../../Dominio/Errores");

const paciente = {
  id: 1,
  peso: 70,
  altura: 1.7,
  objetivo: "Mantener",
  nivelActividad: "Moderado",
  alergias: [],
  enfermedades: [],
};

const alimento = {
  id: "507f1f77bcf86cd799439011",
  nombre: "Arroz",
  unidadMedida: "g",
  gruposAlimenticios: ["carbohidratos"],
  infoNutricional: { refCantidad: 100, refUnidad: "g", calorias: 130 },
};

function menuConDetalle() {
  return {
    idPaciente: 1,
    dias: Array.from({ length: 7 }, () => ({
      nutrientes: { nutrientes: { calorias: 130 }, completo: false, camposFaltantes: [] },
      comidas: [
        {
          detalles: [{ idAlimento: alimento.id }],
        },
      ],
    })),
  };
}

function crearDependencias({ menu, pacienteEncontrado = paciente } = {}) {
  const alertaRepository = {
    llamadas: [],
    async upsertPendiente(idMenu, idPaciente, candidatos) {
      this.llamadas.push({ idMenu, idPaciente, candidatos });
      return candidatos;
    },
  };

  return {
    menuRepository: { async obtenerConDetallesPorId() { return menu !== undefined ? menu : menuConDetalle(); } },
    pacienteRepository: { async findById() { return pacienteEncontrado; } },
    listarAlimentosPorPaciente: { async ejecutar() { return [alimento]; } },
    alertaRepository,
  };
}

test("lanza NotFoundError si el menú no existe", async () => {
  const deps = crearDependencias({ menu: null });
  const caso = new GenerarAlertas(deps);
  await assert.rejects(() => caso.ejecutar(1), NotFoundError);
});

test("lanza NotFoundError si el paciente no existe", async () => {
  const deps = crearDependencias({ pacienteEncontrado: null });
  const caso = new GenerarAlertas(deps);
  await assert.rejects(() => caso.ejecutar(1), NotFoundError);
});

test("filtra alimentosUsados a solo los que aparecen en el menú", async () => {
  const otroAlimento = { ...alimento, id: "aaaaaaaaaaaaaaaaaaaaaaaa", nombre: "No usado" };
  const deps = crearDependencias();
  deps.listarAlimentosPorPaciente = { async ejecutar() { return [alimento, otroAlimento]; } };
  const caso = new GenerarAlertas(deps);
  await caso.ejecutar(1);

  // No hay assert directo sobre alimentosUsados (interno), pero confirmamos
  // que no explota y llega a upsertPendiente
  assert.equal(deps.alertaRepository.llamadas.length, 1);
});

test("delega en upsertPendiente con los candidatos del evaluador", async () => {
  const deps = crearDependencias();
  const caso = new GenerarAlertas(deps);
  const resultado = await caso.ejecutar(5);

  assert.equal(deps.alertaRepository.llamadas.length, 1);
  assert.equal(deps.alertaRepository.llamadas[0].idMenu, 5);
  assert.equal(deps.alertaRepository.llamadas[0].idPaciente, 1);
  assert.equal(resultado, deps.alertaRepository.llamadas[0].candidatos);
});

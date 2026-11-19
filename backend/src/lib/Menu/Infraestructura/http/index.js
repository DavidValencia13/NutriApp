const MenuRoutes = require("./MenuRoutes");
const MenuController = require("./MenuController");
const MenuRepositorySequelize = require("../MenuRepositorySequelize");
const GeneradorMenuIA = require("../GeneradorMenuIA");
const GeneradorPreparacionIA = require("../GeneradorPreparacionIA");
const ExplicarPreparacionMenu = require("../../Aplicacion/ExplicarPreparacionMenu");
const { AsignarBebidaComida } = require("../../Aplicacion/AsignarBebidaComida");
const { detalleRequerimiento, normalizarProteinaPorKg, PROTEINA_MIN_KG, PROTEINA_MAX_KG } = require("../../Dominio/Servicios/RequerimientoCalorico");
const { ValidationError } = require("../../Dominio/Errores");
const { pedirCompletion } = require("../../../../Infraestructura/ia/iaClient");

const GenerarMenuSemanal = require("../../Aplicacion/GenerarMenuSemanal");
const ObtenerMenuPorPaciente = require("../../Aplicacion/ObtenerMenuPorPaciente");
const AjustarComidaMenu = require("../../Aplicacion/AjustarComidaMenu");
const AprobarMenu = require("../../Aplicacion/AprobarMenu");
const CalcularNutrientesPreviewComida = require("../../Aplicacion/CalcularNutrientesPreviewComida");

const limitarMenusPorDia = require("./limitarMenusPorDia");
const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");
const ListarAlimentosPorPaciente = require("../../../Alimento/Aplicacion/ListarAlimentosPorPaciente");
const ResumenPaciente14Dias = require("../../../Asistente/Aplicacion/ResumenPaciente14Dias");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");
const RegistroIngestaRepositorySequelize = require("../../../Portal/Infraestructura/RegistroIngestaRepositorySequelize");
const { MarcaComidaRepositorySequelize } = require("../../../Portal/Infraestructura/repositorios");

module.exports = function registerMenuModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const alimentoRepo = new AlimentoRepositoryMongo();
  const listarAlimentosPorPaciente = new ListarAlimentosPorPaciente(alimentoRepo);
  const generadorMenuIA = new GeneradorMenuIA(pedirCompletion);
  const resumenPaciente14Dias = new ResumenPaciente14Dias({
    seguimientoRepo: new SeguimientoRepositorySequelize(),
    menuRepo,
    ingestaRepo: new RegistroIngestaRepositorySequelize(),
    marcaRepo: new MarcaComidaRepositorySequelize(),
  });

  const explicarPreparacionMenu = new ExplicarPreparacionMenu({
    menuRepository: menuRepo,
    generadorPreparacion: new GeneradorPreparacionIA(pedirCompletion),
  });

  const controller = new MenuController({
    generarMenuSemanal: new GenerarMenuSemanal({
      pacienteRepository: pacienteRepo,
      listarAlimentosPorPaciente,
      generadorMenuIA,
      menuRepository: menuRepo,
      resumenPaciente14Dias,
    }),
    obtenerMenuPorPaciente: new ObtenerMenuPorPaciente(pacienteRepo, menuRepo),
    ajustarComidaMenu: new AjustarComidaMenu({ menuRepository: menuRepo, listarAlimentosPorPaciente }),
    aprobarMenu: new AprobarMenu({ menuRepository: menuRepo, explicarPreparacion: explicarPreparacionMenu }),
    calcularNutrientesPreviewComida: new CalcularNutrientesPreviewComida({ menuRepository: menuRepo, listarAlimentosPorPaciente, pacienteRepository: pacienteRepo }),
    explicarPreparacionMenu,
    asignarBebidaComida: new AsignarBebidaComida({ menuRepository: menuRepo }),
    obtenerRequerimiento: async (idPaciente) => detalleRequerimiento((await pacienteRepo.findById(idPaciente)) || {}),
    // El nutricionista ajusta los g de proteína por kg del paciente (null = sugerido)
    guardarProteina: async (idPaciente, valor) => {
      const proteinaPorKg = normalizarProteinaPorKg(valor);
      if (proteinaPorKg === undefined)
        throw new ValidationError(`La proteína debe estar entre ${PROTEINA_MIN_KG} y ${PROTEINA_MAX_KG} g por kg`);
      return detalleRequerimiento((await pacienteRepo.updateById(idPaciente, { proteinaPorKg })) || {});
    },
  });

  app.use(
    "/api/paciente/:idPaciente/menu",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    MenuRoutes(controller, { limiteGeneracion: limitarMenusPorDia(menuRepo) }),
  );
};

const MenuRoutes = require("./MenuRoutes");
const MenuController = require("./MenuController");
const MenuRepositorySequelize = require("../MenuRepositorySequelize");
const GeneradorMenuGroq = require("../GeneradorMenuGroq");
const { pedirCompletion } = require("../../../../Infraestructura/ia/groqClient");

const GenerarMenuSemanal = require("../../Aplicacion/GenerarMenuSemanal");
const ObtenerMenuPorPaciente = require("../../Aplicacion/ObtenerMenuPorPaciente");
const AjustarComidaMenu = require("../../Aplicacion/AjustarComidaMenu");
const AprobarMenu = require("../../Aplicacion/AprobarMenu");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");
const ListarAlimentosPorPaciente = require("../../../Alimento/Aplicacion/ListarAlimentosPorPaciente");
const RecomendacionRepositorySequelize = require("../../../Recomendacion/Infraestructura/RecomendacionRepositorySequelize");
const RegistrarRecomendacion = require("../../../Recomendacion/Aplicacion/RegistrarRecomendacion");

module.exports = function registerMenuModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const alimentoRepo = new AlimentoRepositoryMongo();
  const listarAlimentosPorPaciente = new ListarAlimentosPorPaciente(alimentoRepo);
  const registrarRecomendacion = new RegistrarRecomendacion(new RecomendacionRepositorySequelize());
  const generadorMenuIA = new GeneradorMenuGroq(pedirCompletion);

  const controller = new MenuController({
    generarMenuSemanal: new GenerarMenuSemanal({
      pacienteRepository: pacienteRepo,
      listarAlimentosPorPaciente,
      generadorMenuIA,
      menuRepository: menuRepo,
      registrarRecomendacion,
    }),
    obtenerMenuPorPaciente: new ObtenerMenuPorPaciente(pacienteRepo, menuRepo),
    ajustarComidaMenu: new AjustarComidaMenu({ menuRepository: menuRepo, listarAlimentosPorPaciente }),
    aprobarMenu: new AprobarMenu(menuRepo),
  });

  app.use(
    "/api/paciente/:idPaciente/menu",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    MenuRoutes(controller),
  );
};

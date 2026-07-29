const SugerenciaRoutes = require("./SugerenciaRoutes");
const SugerenciaController = require("./SugerenciaController");
const ObtenerSugerenciasMenu = require("../../Aplicacion/ObtenerSugerenciasMenu");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");
const ListarAlimentosPorPaciente = require("../../../Alimento/Aplicacion/ListarAlimentosPorPaciente");

module.exports = function registerSugerenciaModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const alimentoRepo = new AlimentoRepositoryMongo();
  const listarAlimentosPorPaciente = new ListarAlimentosPorPaciente(alimentoRepo);

  const controller = new SugerenciaController({
    obtenerSugerenciasMenu: new ObtenerSugerenciasMenu({
      menuRepository: menuRepo,
      pacienteRepository: pacienteRepo,
      listarAlimentosPorPaciente,
    }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/sugerencia",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    SugerenciaRoutes(controller),
  );
};

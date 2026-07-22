const RecomendacionRoutes = require("./RecomendacionRoutes");
const RecomendacionController = require("./RecomendacionController");
const RecomendacionRepositorySequelize = require("../RecomendacionRepositorySequelize");
const ListarRecomendacionesPorPaciente = require("../../Aplicacion/ListarRecomendacionesPorPaciente");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");

module.exports = function registerRecomendacionModule(app) {
  const recomendacionRepo = new RecomendacionRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();

  const controller = new RecomendacionController({
    listarRecomendacionesPorPaciente: new ListarRecomendacionesPorPaciente(pacienteRepo, recomendacionRepo),
  });

  app.use(
    "/api/paciente/:idPaciente/recomendacion",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    RecomendacionRoutes(controller),
  );
};

const SeguimientoRoutes = require("./SeguimientoRoutes");
const SeguimientoController = require("./SeguimientoController");
const SeguimientoRepositorySequelize = require("../SeguimientoRepositorySequelize");
const RegistrarSeguimiento = require("../../Aplicacion/RegistrarSeguimiento");
const ListarSeguimientoPorPaciente = require("../../Aplicacion/ListarSeguimientoPorPaciente");
const EliminarSeguimiento = require("../../Aplicacion/EliminarSeguimiento");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");

module.exports = function registerSeguimientoModule(app) {
  const repo = new SeguimientoRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();

  const controller = new SeguimientoController({
    registrarSeguimiento: new RegistrarSeguimiento(repo),
    listarSeguimientoPorPaciente: new ListarSeguimientoPorPaciente(repo),
    eliminarSeguimiento: new EliminarSeguimiento(repo),
  });

  app.use(
    "/api/paciente/:idPaciente/seguimiento",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    SeguimientoRoutes(controller),
  );
};

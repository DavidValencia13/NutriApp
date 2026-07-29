const ConsultaRoutes = require("./ConsultaRoutes");
const ConsultaController = require("./ConsultaController");
const ConsultaRepositorySequelize = require("../ConsultaRepositorySequelize");
const RegistrarConsulta = require("../../Aplicacion/RegistrarConsulta");
const ListarConsultasPorPaciente = require("../../Aplicacion/ListarConsultasPorPaciente");
const EliminarConsulta = require("../../Aplicacion/EliminarConsulta");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");

module.exports = function registerConsultaModule(app) {
  const repo = new ConsultaRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();

  const controller = new ConsultaController({
    registrarConsulta: new RegistrarConsulta(repo),
    listarConsultasPorPaciente: new ListarConsultasPorPaciente(repo),
    eliminarConsulta: new EliminarConsulta(repo),
  });

  app.use(
    "/api/paciente/:idPaciente/consulta",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    ConsultaRoutes(controller),
  );
};

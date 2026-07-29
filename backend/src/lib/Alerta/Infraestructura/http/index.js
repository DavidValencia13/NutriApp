const AlertaRoutes = require("./AlertaRoutes");
const AlertaController = require("./AlertaController");
const AlertaRepositorySequelize = require("../AlertaRepositorySequelize");
const ListarAlertasPorMenu = require("../../Aplicacion/ListarAlertasPorMenu");
const ResolverAlerta = require("../../Aplicacion/ResolverAlerta");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");

module.exports = function registerAlertaModule(app) {
  const alertaRepo = new AlertaRepositorySequelize();
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();

  const controller = new AlertaController({
    listarAlertasPorMenu: new ListarAlertasPorMenu({ menuRepository: menuRepo, alertaRepository: alertaRepo }),
    resolverAlerta: new ResolverAlerta({ alertaRepository: alertaRepo }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/alerta",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    AlertaRoutes(controller),
  );
};

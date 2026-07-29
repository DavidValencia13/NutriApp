const EfectividadRoutes = require("./EfectividadRoutes");
const EfectividadController = require("./EfectividadController");
const ObtenerEfectividadMenu = require("../../Aplicacion/ObtenerEfectividadMenu");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const AlertaRepositorySequelize = require("../../../Alerta/Infraestructura/AlertaRepositorySequelize");
const ConsultaRepositorySequelize = require("../../../Consulta/Infraestructura/ConsultaRepositorySequelize");
const CumplimientoRepositorySequelize = require("../../../Cumplimiento/Infraestructura/CumplimientoRepositorySequelize");
const ObtenerResumenCumplimiento = require("../../../Cumplimiento/Aplicacion/ObtenerResumenCumplimiento");

module.exports = function registerEfectividadModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const alertaRepo = new AlertaRepositorySequelize();
  const consultaRepo = new ConsultaRepositorySequelize();
  const cumplimientoRepo = new CumplimientoRepositorySequelize();

  const obtenerResumenCumplimiento = new ObtenerResumenCumplimiento({
    cumplimientoRepository: cumplimientoRepo,
    menuRepository: menuRepo,
  });

  const controller = new EfectividadController({
    obtenerEfectividadMenu: new ObtenerEfectividadMenu({
      menuRepository: menuRepo,
      pacienteRepository: pacienteRepo,
      alertaRepository: alertaRepo,
      consultaRepository: consultaRepo,
      obtenerResumenCumplimiento,
    }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/efectividad",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    EfectividadRoutes(controller),
  );
};

const ReporteRoutes = require("./ReporteRoutes");
const ReporteController = require("./ReporteController");
const ObtenerReporteNutricional = require("../../Aplicacion/ObtenerReporteNutricional");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const AlertaRepositorySequelize = require("../../../Alerta/Infraestructura/AlertaRepositorySequelize");
const ConsultaRepositorySequelize = require("../../../Consulta/Infraestructura/ConsultaRepositorySequelize");
const RecomendacionRepositorySequelize = require("../../../Recomendacion/Infraestructura/RecomendacionRepositorySequelize");
const CumplimientoRepositorySequelize = require("../../../Cumplimiento/Infraestructura/CumplimientoRepositorySequelize");
const ObtenerResumenCumplimiento = require("../../../Cumplimiento/Aplicacion/ObtenerResumenCumplimiento");
const ObtenerEfectividadMenu = require("../../../Efectividad/Aplicacion/ObtenerEfectividadMenu");
const ObtenerSugerenciasMenu = require("../../../Sugerencia/Aplicacion/ObtenerSugerenciasMenu");
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");
const ListarAlimentosPorPaciente = require("../../../Alimento/Aplicacion/ListarAlimentosPorPaciente");

module.exports = function registerReporteModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const alertaRepo = new AlertaRepositorySequelize();
  const consultaRepo = new ConsultaRepositorySequelize();
  const recomendacionRepo = new RecomendacionRepositorySequelize();
  const cumplimientoRepo = new CumplimientoRepositorySequelize();
  const alimentoRepo = new AlimentoRepositoryMongo();

  const obtenerResumenCumplimiento = new ObtenerResumenCumplimiento({
    cumplimientoRepository: cumplimientoRepo,
    menuRepository: menuRepo,
  });
  const obtenerEfectividadMenu = new ObtenerEfectividadMenu({
    menuRepository: menuRepo,
    pacienteRepository: pacienteRepo,
    alertaRepository: alertaRepo,
    consultaRepository: consultaRepo,
    obtenerResumenCumplimiento,
  });
  const obtenerSugerenciasMenu = new ObtenerSugerenciasMenu({
    menuRepository: menuRepo,
    pacienteRepository: pacienteRepo,
    listarAlimentosPorPaciente: new ListarAlimentosPorPaciente(alimentoRepo),
  });

  const controller = new ReporteController({
    obtenerReporteNutricional: new ObtenerReporteNutricional({
      menuRepository: menuRepo,
      pacienteRepository: pacienteRepo,
      alertaRepository: alertaRepo,
      consultaRepository: consultaRepo,
      recomendacionRepository: recomendacionRepo,
      obtenerResumenCumplimiento,
      obtenerEfectividadMenu,
      obtenerSugerenciasMenu,
    }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/reporte",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    ReporteRoutes(controller),
  );
};

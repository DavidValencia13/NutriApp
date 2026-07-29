const CumplimientoRoutes = require("./CumplimientoRoutes");
const CumplimientoController = require("./CumplimientoController");
const CumplimientoRepositorySequelize = require("../CumplimientoRepositorySequelize");
const RegistrarCumplimiento = require("../../Aplicacion/RegistrarCumplimiento");
const ListarCumplimientoPorMenu = require("../../Aplicacion/ListarCumplimientoPorMenu");
const EliminarRegistroCumplimiento = require("../../Aplicacion/EliminarRegistroCumplimiento");
const ObtenerResumenCumplimiento = require("../../Aplicacion/ObtenerResumenCumplimiento");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");

module.exports = function registerCumplimientoModule(app) {
  const cumplimientoRepo = new CumplimientoRepositorySequelize();
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();

  const controller = new CumplimientoController({
    registrarCumplimiento: new RegistrarCumplimiento({ cumplimientoRepository: cumplimientoRepo, menuRepository: menuRepo }),
    listarCumplimientoPorMenu: new ListarCumplimientoPorMenu({ cumplimientoRepository: cumplimientoRepo, menuRepository: menuRepo }),
    eliminarRegistroCumplimiento: new EliminarRegistroCumplimiento({ cumplimientoRepository: cumplimientoRepo, menuRepository: menuRepo }),
    obtenerResumenCumplimiento: new ObtenerResumenCumplimiento({ cumplimientoRepository: cumplimientoRepo, menuRepository: menuRepo }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/cumplimiento",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    CumplimientoRoutes(controller),
  );
};

const EfectividadRoutes = require("./EfectividadRoutes");
const EfectividadController = require("./EfectividadController");
const ObtenerEfectividadMenu = require("../../Aplicacion/ObtenerEfectividadMenu");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");

module.exports = function registerEfectividadModule(app) {
  const menuRepo = new MenuRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const seguimientoRepo = new SeguimientoRepositorySequelize();

  const controller = new EfectividadController({
    obtenerEfectividadMenu: new ObtenerEfectividadMenu({
      menuRepository: menuRepo,
      pacienteRepository: pacienteRepo,
      seguimientoRepository: seguimientoRepo,
    }),
  });

  app.use(
    "/api/paciente/:idPaciente/menu/:idMenu/efectividad",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    EfectividadRoutes(controller),
  );
};

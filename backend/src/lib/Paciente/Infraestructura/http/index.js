const PacienteRoutes = require("./PacienteRoutes");
const PacienteController = require("./PacienteController");
const PacienteRepositorySequelize = require("../PacienteRepositorySequelize");
const RegistrarPaciente = require("../../Aplicacion/RegistrarPaciente");
const EditarPaciente = require("../../Aplicacion/EditarPaciente");
const EliminarPaciente = require("../../Aplicacion/EliminarPaciente");
const ListarPacientes = require("../../Aplicacion/ListarPacientes");
const CrearPacienteDemo = require("../../Aplicacion/CrearPacienteDemo");

// Dependencias cruzadas de solo borrado: al eliminar un paciente se borran
// también sus datos en otros módulos (ver EliminarPaciente)
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");
const RecomendacionRepositorySequelize = require("../../../Recomendacion/Infraestructura/RecomendacionRepositorySequelize");

module.exports = function registerPacienteModule(app) {
  const repo = new PacienteRepositorySequelize();

  const controller = new PacienteController({
    registrarPaciente: new RegistrarPaciente(repo),
    editarPaciente: new EditarPaciente(repo),
    eliminarPaciente: new EliminarPaciente(repo, [
      new AlimentoRepositoryMongo(),
      new SeguimientoRepositorySequelize(),
      new RecomendacionRepositorySequelize(),
    ]),
    listarPacientes: new ListarPacientes(repo),
    crearPacienteDemo: new CrearPacienteDemo({ pacienteRepository: repo, alimentoRepository: new AlimentoRepositoryMongo() }),
  });

  app.use("/api/paciente", PacienteRoutes(controller));
};

const PacienteRoutes = require("./PacienteRoutes");
const PacienteController = require("./PacienteController");
const PacienteRepositorySequelize = require("../PacienteRepositorySequelize");
const RegistrarPaciente = require("../../Aplicacion/RegistrarPaciente");
const EditarPaciente = require("../../Aplicacion/EditarPaciente");
const EliminarPaciente = require("../../Aplicacion/EliminarPaciente");
const ListarPacientes = require("../../Aplicacion/ListarPacientes");

module.exports = function registerPacienteModule(app) {
  const repo = new PacienteRepositorySequelize();

  const controller = new PacienteController({
    registrarPaciente: new RegistrarPaciente(repo),
    editarPaciente: new EditarPaciente(repo),
    eliminarPaciente: new EliminarPaciente(repo),
    listarPacientes: new ListarPacientes(repo),
  });

  app.use("/api/paciente", PacienteRoutes(controller));
};
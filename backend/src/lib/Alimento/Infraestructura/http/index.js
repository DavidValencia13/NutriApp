const AlimentoRoutes = require("./AlimentoRoutes");
const AlimentoController = require("./AlimentoController");
const verificarPropietarioPaciente = require("./verificarPropietarioPaciente");
const AlimentoRepositoryMongo = require("../AlimentoRepositoryMongo");
const BuscadorNutricionalUSDA = require("../BuscadorNutricionalUSDA");
const RegistrarAlimento = require("../../Aplicacion/RegistrarAlimento");
const EditarAlimento = require("../../Aplicacion/EditarAlimento");
const EliminarAlimento = require("../../Aplicacion/EliminarAlimento");
const ListarAlimentosPorPaciente = require("../../Aplicacion/ListarAlimentosPorPaciente");
const BuscarInfoNutricional = require("../../Aplicacion/BuscarInfoNutricional");

const { pedirCompletion } = require("../../../../Infraestructura/ia/groqClient");

// Dependencias cruzadas de solo lectura (mismo estilo que Paciente ya
// importa authMiddleware de Nutriólogo): necesitamos verificar la
// propiedad del paciente antes de tocar sus alimentos.
const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");

module.exports = function registerAlimentoModule(app) {
  const repo = new AlimentoRepositoryMongo();
  const pacienteRepo = new PacienteRepositorySequelize();

  const buscadorNutricional = new BuscadorNutricionalUSDA(pedirCompletion);

  const controller = new AlimentoController({
    registrarAlimento: new RegistrarAlimento(repo),
    editarAlimento: new EditarAlimento(repo),
    eliminarAlimento: new EliminarAlimento(repo),
    listarAlimentosPorPaciente: new ListarAlimentosPorPaciente(repo),
    buscarInfoNutricional: new BuscarInfoNutricional(buscadorNutricional),
  });

  app.use(
    "/api/paciente/:idPaciente/alimento",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    AlimentoRoutes(controller),
  );
};

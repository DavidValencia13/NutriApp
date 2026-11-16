const AlimentoRoutes = require("./AlimentoRoutes");
const AlimentoController = require("./AlimentoController");
const verificarPropietarioPaciente = require("./verificarPropietarioPaciente");
const AlimentoRepositoryMongo = require("../AlimentoRepositoryMongo");
const BuscadorNutricionalUSDA = require("../BuscadorNutricionalUSDA");
const BuscadorNutricionalUSFQ = require("../BuscadorNutricionalUSFQ");
const BuscadorNutricionalCombinado = require("../BuscadorNutricionalCombinado");
const ReferenciaUSFQModel = require("../ReferenciaUSFQModel");
const RegistrarAlimento = require("../../Aplicacion/RegistrarAlimento");
const EditarAlimento = require("../../Aplicacion/EditarAlimento");
const EliminarAlimento = require("../../Aplicacion/EliminarAlimento");
const ListarAlimentosPorPaciente = require("../../Aplicacion/ListarAlimentosPorPaciente");
const BuscarInfoNutricional = require("../../Aplicacion/BuscarInfoNutricional");
const EvaluarCoberturaCatalogo = require("../../Aplicacion/EvaluarCoberturaCatalogo");

const { pedirCompletion } = require("../../../../Infraestructura/ia/iaClient");

// Dependencias cruzadas de solo lectura (mismo estilo que Paciente ya
// importa authMiddleware de Nutriólogo): necesitamos verificar la
// propiedad del paciente antes de tocar sus alimentos.
const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");

module.exports = function registerAlimentoModule(app) {
  const repo = new AlimentoRepositoryMongo();
  const pacienteRepo = new PacienteRepositorySequelize();

  const buscadorLocal = new BuscadorNutricionalUSFQ(() => ReferenciaUSFQModel.find().lean());
  // Sin clave USDA se usa directamente la tabla local: no se intenta una
  // petición externa que sabemos que fallará en cada alimento.
  const buscadorNutricional = process.env.USDA_FDC_API_KEY
    ? new BuscadorNutricionalCombinado({
      principal: new BuscadorNutricionalUSDA(pedirCompletion),
      secundario: buscadorLocal,
    })
    : buscadorLocal;

  const controller = new AlimentoController({
    registrarAlimento: new RegistrarAlimento(repo),
    editarAlimento: new EditarAlimento(repo),
    eliminarAlimento: new EliminarAlimento(repo),
    listarAlimentosPorPaciente: new ListarAlimentosPorPaciente(repo),
    buscarInfoNutricional: new BuscarInfoNutricional(buscadorNutricional),
    evaluarCoberturaCatalogo: new EvaluarCoberturaCatalogo({
      alimentoRepository: repo,
      pacienteRepository: pacienteRepo,
    }),
  });

  app.use(
    "/api/paciente/:idPaciente/alimento",
    authMiddleware,
    verificarPropietarioPaciente(pacienteRepo),
    AlimentoRoutes(controller),
  );
};

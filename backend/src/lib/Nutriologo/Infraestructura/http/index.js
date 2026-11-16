const NutriologoRoutes = require("./NutriologoRoutes");
const NutriologoController = require("./NutriologoController");
const NutriologoRepositorySequelize = require("../NutriologoRepositorySequelize");
const RegistrarNutriologo = require("../../Aplicacion/RegistrarNutriologo");
const LoginNutriologo = require("../../Aplicacion/LoginNutriologo");
const ObtenerNutriologo = require("../../Aplicacion/ObtenerNutriologo");
const CrearPacienteDemo = require("../../../Paciente/Aplicacion/CrearPacienteDemo");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const AlimentoRepositoryMongo = require("../../../Alimento/Infraestructura/AlimentoRepositoryMongo");

module.exports = function registerNutriologoModule(app) {
  const repo = new NutriologoRepositorySequelize();

  const controller = new NutriologoController({
    registrarNutriologo: new RegistrarNutriologo(repo, { codigoInvitacion: process.env.CODIGO_INVITACION }),
    loginNutriologo: new LoginNutriologo(repo),
    obtenerNutriologo: new ObtenerNutriologo(repo),
    crearPacienteDemo: new CrearPacienteDemo({
      pacienteRepository: new PacienteRepositorySequelize(),
      alimentoRepository: new AlimentoRepositoryMongo(),
    }),
  });

  app.use("/api/nutriologo", NutriologoRoutes(controller));
};

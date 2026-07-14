const NutriologoRoutes = require("./NutriologoRoutes");
const NutriologoController = require("./NutriologoController");
const NutriologoRepositorySequelize = require("../NutriologoRepositorySequelize");
const RegistrarNutriologo = require("../../Aplicacion/RegistrarNutriologo");
const LoginNutriologo = require("../../Aplicacion/LoginNutriologo");
const ObtenerNutriologo = require("../../Aplicacion/ObtenerNutriologo");

module.exports = function registerNutriologoModule(app) {
  const repo = new NutriologoRepositorySequelize();

  const controller = new NutriologoController({
    registrarNutriologo: new RegistrarNutriologo(repo),
    loginNutriologo: new LoginNutriologo(repo),
    obtenerNutriologo: new ObtenerNutriologo(repo),
  });

  app.use("/api/nutriologo", NutriologoRoutes(controller));
};

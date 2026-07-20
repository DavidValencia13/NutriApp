const express = require("express");
const cors = require("cors"); // CORS (permite que otro origen/dominio le pida datos a tu API)
const registerNutriologoModule = require("./lib/Nutriologo/Infraestructura/http");
const registerPacienteModule = require("./lib/Paciente/Infraestructura/http");
const registerAlimentoModule = require("./lib/Alimento/Infraestructura/http");

function buildApp() {
  const app = express();

  app.use(cors()); // habilita CORS globalmente
  app.use(express.json()); // parsea (interpreta) el body en JSON
  app.use(express.urlencoded({ extended: true })); // parsea el body tipo formulario

  // Registrar módulos aquí, ANTES del  código de estado HTTP 404
  registerNutriologoModule(app);
  registerPacienteModule(app);
  registerAlimentoModule(app);

  // Catch-all (atrapa todo lo que no coincidió arriba) → 404 = ruta no existe
  app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
  });

  // Error handler (atrapa errores lanzados en los controllers)
  // En 500 no se reenvía err.message al cliente: podría filtrar detalles
  // internos de Sequelize/Mongoose/stack. El mensaje real solo se loguea.
  app.use((err, req, res, next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message =
      statusCode === 500 ? "Error interno del servidor" : err.message;
    res.status(statusCode).json({ message });
  });

  return app;
}

module.exports = buildApp;

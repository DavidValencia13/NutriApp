const express = require("express");
const router = express.Router();

module.exports = (controller) => {
  // Rutas públicas (no necesitan token)
  router.post("/registrar", controller.registrar);
  router.post("/login", controller.login);

  // Rutas protegidas (necesitan token)
  router.get("/:id", controller.obtener);

  return router;
};

const express = require("express");
const router = express.Router();
const authMiddleware = require("./authMiddleware");

module.exports = (controller) => {
  // Rutas públicas (no necesitan token)
  router.post("/registrar", controller.registrar);
  router.post("/login", controller.login);

  router.get("/me/whatsapp", authMiddleware, controller.obtenerWhatsapp);
  router.put("/me/whatsapp", authMiddleware, controller.actualizarWhatsapp);

  // Ruta protegida: Express ejecuta authMiddleware primero,
  // y solo si llama a next() pasa al controller.obtener
  router.get("/:id", authMiddleware, controller.obtener);

  return router;
};

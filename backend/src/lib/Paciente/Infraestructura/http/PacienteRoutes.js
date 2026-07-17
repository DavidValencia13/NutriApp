const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
// (reutilizamos el mismo middleware que ya hicimos, no hace falta duplicarlo)

module.exports = (controller) => {
  // Son todas las rutas de Paciente requieren estar logueado
  router.post("/", authMiddleware, controller.registrar);
  router.put("/:id", authMiddleware, controller.editar);
  router.delete("/:id", authMiddleware, controller.eliminar);
  router.get("/", authMiddleware, controller.listar);

  return router;
};
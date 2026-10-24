const express = require("express");
const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");

function AsistenteRoutes(controller) {
  const router = express.Router();

  // POST /api/asistente/chat
  // Body: { idPaciente?: number, mensaje: string, historial?: [{rol, contenido}] }
  router.post("/chat", authMiddleware, (req, res, next) =>
    controller.chat(req, res, next)
  );

  return router;
}

module.exports = AsistenteRoutes;

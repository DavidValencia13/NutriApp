const express = require("express");
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.post("/generar", controller.generar); // RF-008
  router.get("/", controller.obtener); // RF-009 / RF-0010
  router.put("/comida/:idComidaMenu", controller.ajustar); // RF-0011
  router.post("/:idMenu/aprobar", controller.aprobar);
  return router;
};

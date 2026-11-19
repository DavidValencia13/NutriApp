const express = require("express");
const router = express.Router({ mergeParams: true });

module.exports = (controller, { limiteGeneracion } = {}) => {
  // limiteGeneracion: middleware que corta si ya generó demasiados menús hoy
  router.post("/generar", ...(limiteGeneracion ? [limiteGeneracion] : []), controller.generar); // RF-008
  router.get("/", controller.obtener); // RF-009 / RF-0010
  router.get("/historial", controller.historial);
  router.get("/requerimiento", controller.requerimiento); // cómo se calculó la meta y los macros
  router.put("/requerimiento/proteina", controller.guardarProteina); // g de proteína por kg
  router.get("/historial/:idMenu", controller.obtenerVersion);
  router.put("/comida/:idComidaMenu", controller.ajustar); // RF-0011
  router.post("/:idMenu/preview-nutrientes", controller.previewNutrientes); // feedback en vivo
  router.post("/:idMenu/aprobar", controller.aprobar);
  // Explicación de preparación (IA a pedido + corrección del nutricionista)
  router.post("/:idMenu/preparacion", controller.generarPreparacion);
  router.put("/comida/:idComidaMenu/preparacion", controller.editarPreparacion);
  router.put("/comida/:idComidaMenu/bebida", controller.asignarBebida);
  return router;
};

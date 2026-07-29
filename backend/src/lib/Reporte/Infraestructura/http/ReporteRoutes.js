const express = require("express");
// mergeParams: true — este router se monta bajo
// /api/paciente/:idPaciente/menu/:idMenu/reporte.
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.get("/", controller.obtener);

  return router;
};

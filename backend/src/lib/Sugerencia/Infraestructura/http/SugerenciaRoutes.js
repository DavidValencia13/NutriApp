const express = require("express");
// mergeParams: true — este router se monta bajo
// /api/paciente/:idPaciente/menu/:idMenu/sugerencia.
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.get("/", controller.listar);

  return router;
};

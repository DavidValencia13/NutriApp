const express = require("express");
// mergeParams: true — este router se monta bajo
// /api/paciente/:idPaciente/menu/:idMenu/alerta.
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.get("/", controller.listar);
  router.patch("/:idAlerta", controller.resolver);

  return router;
};

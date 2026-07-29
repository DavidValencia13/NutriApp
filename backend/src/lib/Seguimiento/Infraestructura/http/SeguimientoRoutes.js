const express = require("express");
// mergeParams: true — este router se monta bajo /api/paciente/:idPaciente/seguimiento.
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.post("/", controller.registrar);
  router.get("/", controller.listar);
  router.delete("/:id", controller.eliminar);

  return router;
};

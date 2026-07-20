const express = require("express");
// mergeParams: true es necesario porque este router se monta bajo
// /api/paciente/:idPaciente/alimento — sin esto, :idPaciente del path padre
// no llegaría a req.params dentro de este router.
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.post("/", controller.registrar);
  router.get("/", controller.listar);
  router.put("/:id", controller.editar);
  router.delete("/:id", controller.eliminar);

  return router;
};

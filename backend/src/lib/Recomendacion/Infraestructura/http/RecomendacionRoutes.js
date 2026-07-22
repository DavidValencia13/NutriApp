const express = require("express");
const router = express.Router({ mergeParams: true });

module.exports = (controller) => {
  router.get("/", controller.listar); // RF-0012: solo lectura, el registro ocurre desde Menu
  return router;
};

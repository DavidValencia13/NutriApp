const { ValidationError } = require("../Errores");

class DiaMenu {
  constructor({ id, idMenu, numeroDia, caloriasTotales }) {
    if (!Number.isInteger(numeroDia) || numeroDia < 1 || numeroDia > 7)
      throw new ValidationError("numeroDia debe ser un entero entre 1 y 7");

    if (!Number.isFinite(caloriasTotales) || caloriasTotales < 0)
      throw new ValidationError("caloriasTotales debe ser un número finito >= 0");

    this.id = id;
    this.idMenu = idMenu;
    this.numeroDia = numeroDia;
    this.caloriasTotales = caloriasTotales;
  }
}

module.exports = DiaMenu;

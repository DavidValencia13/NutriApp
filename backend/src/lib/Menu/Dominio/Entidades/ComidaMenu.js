const { ValidationError } = require("../Errores");

class ComidaMenu {
  constructor({ id, idDiaMenu, orden, tipoComida, calorias }) {
    if (!Number.isInteger(orden) || orden < 1)
      throw new ValidationError("orden debe ser un entero positivo");

    if (!tipoComida || tipoComida.trim().length === 0)
      throw new ValidationError("tipoComida es requerido");

    if (!Number.isFinite(calorias) || calorias < 0)
      throw new ValidationError("calorias debe ser un número finito >= 0");

    this.id = id;
    this.idDiaMenu = idDiaMenu;
    this.orden = orden;
    this.tipoComida = tipoComida.trim();
    this.calorias = calorias;
  }
}

module.exports = ComidaMenu;

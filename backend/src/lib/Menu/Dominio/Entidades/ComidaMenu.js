const { ValidationError } = require("../Errores");

class ComidaMenu {
  constructor({
    id,
    idDiaMenu,
    orden,
    tipoComida,
    nombrePlato,
    calorias,
    nutrientes,
  }) {
    if (!Number.isInteger(orden) || orden < 1)
      throw new ValidationError("orden debe ser un entero positivo");

    if (!tipoComida || tipoComida.trim().length === 0)
      throw new ValidationError("tipoComida es requerido");

    if (!nombrePlato || nombrePlato.trim().length === 0)
      throw new ValidationError("nombrePlato es requerido");

    if (!Number.isFinite(calorias) || calorias < 0)
      throw new ValidationError("calorias debe ser un número finito >= 0");

    this.id = id;
    this.idDiaMenu = idDiaMenu;
    this.orden = orden;
    this.tipoComida = tipoComida.trim();
    this.nombrePlato = nombrePlato.trim();
    this.calorias = calorias;
    // Desglose real de macro/micronutrientes calculado a partir de los
    // alimentos usados (ver CalculadoraNutricional) — opcional porque
    // ComidaMenu puede construirse antes de que exista ese cálculo.
    this.nutrientes = nutrientes;
  }
}

module.exports = ComidaMenu;

const { ValidationError } = require("../Dominio/Errores");

// Caso de uso: sugerir información nutricional desde una fuente externa.
// Nunca guarda nada — el resultado es solo una sugerencia que el
// nutriólogo revisa/edita antes de registrar el alimento.
class BuscarInfoNutricional {
  constructor(buscadorNutricional) {
    this.buscadorNutricional = buscadorNutricional;
  }

  async ejecutar(nombre) {
    if (!nombre || nombre.trim().length === 0)
      throw new ValidationError("El nombre es requerido para buscar");

    return await this.buscadorNutricional.buscar(nombre.trim());
  }
}

module.exports = BuscarInfoNutricional;

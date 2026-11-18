const { NotFoundError, ValidationError } = require("../Dominio/Errores");

// Bebida que acompaña una comida (vaso de agua, agua aromática, jugo...).
// Es un complemento que el nutricionista agrega o cambia en cualquier
// momento; el paciente la ve en su menú. null = sin bebida.
const MAX_BEBIDA = 160;

function normalizarBebida(bebida) {
  if (bebida === null || bebida === undefined) return null;
  if (typeof bebida !== "string") throw new ValidationError("La bebida debe ser texto");
  const limpia = bebida.replace(/\s+/g, " ").trim();
  if (!limpia) return null;
  if (limpia.length > MAX_BEBIDA) throw new ValidationError(`La bebida admite como máximo ${MAX_BEBIDA} caracteres`);
  return limpia;
}

class AsignarBebidaComida {
  constructor({ menuRepository }) {
    this.menuRepository = menuRepository;
  }

  async ejecutar(idComidaMenu, idNutriologo, bebida) {
    const comida = await this.menuRepository.obtenerComidaConPropietario(idComidaMenu, idNutriologo);
    if (!comida) throw new NotFoundError("Comida no encontrada");
    const limpia = normalizarBebida(bebida);
    await this.menuRepository.guardarBebida(idComidaMenu, limpia);
    return { idComidaMenu, bebida: limpia };
  }
}

module.exports = { AsignarBebidaComida, normalizarBebida };

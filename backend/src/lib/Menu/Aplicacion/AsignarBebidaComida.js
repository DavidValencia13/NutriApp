const { NotFoundError, ValidationError } = require("../Dominio/Errores");

// Bebida que acompaña una comida. Si tiene calorías (jugo, colada, leche...)
// se guardan sus nutrientes para la cantidad servida, calculados con la
// misma tabla de referencia que los alimentos (USDA / USFQ, valores por
// 100 ml), y se SUMAN a la comida y al día. Agua o infusiones sin azúcar no
// aportan calorías. null = sin bebida.
const MAX_BEBIDA = 160;
const CAMPOS = [
  "calorias", "proteinas", "carbohidratos", "grasasTotales", "grasasSaturadas", "fibra", "azucares",
  "sodio", "potasio", "calcio", "hierro", "magnesio", "vitaminaA", "vitaminaC", "vitaminaD", "vitaminaB12",
];

function normalizarBebida(bebida) {
  if (bebida === null || bebida === undefined) return null;
  if (typeof bebida !== "string") throw new ValidationError("La bebida debe ser texto");
  const limpia = bebida.replace(/\s+/g, " ").trim();
  if (!limpia) return null;
  if (limpia.length > MAX_BEBIDA) throw new ValidationError(`La bebida admite como máximo ${MAX_BEBIDA} caracteres`);
  return limpia;
}

// { ml, por100: { calorias, ... }, fuente, referencia } -> nutrientes de la porción
function nutricionDeBebida({ ml, por100, fuente, referencia } = {}) {
  if (!por100) return null;
  const cantidad = Number(ml);
  if (!Number.isFinite(cantidad) || cantidad < 10 || cantidad > 1000)
    throw new ValidationError("La cantidad de la bebida debe estar entre 10 y 1000 ml");
  const calorias100 = Number(por100.calorias);
  if (!Number.isFinite(calorias100) || calorias100 < 0 || calorias100 > 900)
    throw new ValidationError("Los datos nutricionales de la bebida no son válidos");
  const factor = cantidad / 100;
  const nutrientes = {};
  for (const campo of CAMPOS) {
    const valor = Number(por100[campo]);
    if (Number.isFinite(valor) && valor >= 0) nutrientes[campo] = Math.round(valor * factor * 100) / 100;
  }
  nutrientes.calorias = Math.round(calorias100 * factor);
  return {
    ml: Math.round(cantidad),
    nutrientes,
    fuente: fuente ? String(fuente).slice(0, 20) : null,
    referencia: referencia ? String(referencia).slice(0, 160) : null,
  };
}

class AsignarBebidaComida {
  constructor({ menuRepository }) {
    this.menuRepository = menuRepository;
  }

  // datos: { bebida, ml?, por100?, fuente?, referencia? }
  async ejecutar(idComidaMenu, idNutriologo, datos = {}) {
    const comida = await this.menuRepository.obtenerComidaConPropietario(idComidaMenu, idNutriologo);
    if (!comida) throw new NotFoundError("Comida no encontrada");
    const nombre = normalizarBebida(typeof datos === "string" ? datos : datos.bebida);
    const nutricion = nombre && typeof datos === "object" ? nutricionDeBebida(datos) : null;
    await this.menuRepository.guardarBebida(idComidaMenu, nombre, nutricion);
    return { idComidaMenu, bebida: nombre, bebidaNutricion: nutricion };
  }
}

module.exports = { AsignarBebidaComida, normalizarBebida, nutricionDeBebida };

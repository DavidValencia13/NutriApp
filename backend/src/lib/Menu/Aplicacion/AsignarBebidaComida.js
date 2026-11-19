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

const MAX_INGREDIENTES = 8;

function validarMl(ml) {
  const cantidad = Number(ml);
  if (!Number.isFinite(cantidad) || cantidad < 10 || cantidad > 1000)
    throw new ValidationError("La cantidad de la bebida debe estar entre 10 y 1000 ml");
  return cantidad;
}

// Nutrientes de una cantidad (g o ml) a partir de la ficha por 100
function nutrientesDe(por100, cantidad) {
  const calorias100 = Number(por100?.calorias);
  if (!Number.isFinite(calorias100) || calorias100 < 0 || calorias100 > 900)
    throw new ValidationError("Los datos nutricionales de la bebida no son válidos");
  const factor = cantidad / 100;
  const nutrientes = {};
  for (const campo of CAMPOS) {
    const valor = Number(por100[campo]);
    if (Number.isFinite(valor) && valor >= 0) nutrientes[campo] = valor * factor;
  }
  nutrientes.calorias = calorias100 * factor;
  return nutrientes;
}

function redondear(nutrientes) {
  const r = {};
  for (const [campo, valor] of Object.entries(nutrientes)) r[campo] = Math.round(valor * 100) / 100;
  r.calorias = Math.round(nutrientes.calorias || 0);
  return r;
}

// Bebida preparada (batido, jugo, colada): el nutricionista elige cada
// ingrediente y su cantidad (leche entera o vegetal, azúcar, panela,
// Splenda...). Cada uno con su ficha por 100 g/ml; los endulzantes sin
// calorías van con sinCalorias. Se suman todos.
function nutricionPorIngredientes({ ml, ingredientes, fuente }) {
  if (ingredientes.length > MAX_INGREDIENTES)
    throw new ValidationError(`La bebida admite como máximo ${MAX_INGREDIENTES} ingredientes`);
  const total = {};
  const lista = ingredientes.map((ing) => {
    const nombre = normalizarBebida(ing?.nombre);
    if (!nombre) throw new ValidationError("Cada ingrediente de la bebida necesita un nombre");
    const cantidad = Number(ing.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 1000)
      throw new ValidationError(`La cantidad de "${nombre}" debe estar entre 1 y 1000 g o ml`);
    const unidad = ing.unidad === "ml" ? "ml" : "g";
    let nutrientes = { calorias: 0 };
    if (!ing.sinCalorias) {
      if (!ing.por100) throw new ValidationError(`Busca "${nombre}" en las tablas o márcalo como sin calorías`);
      nutrientes = nutrientesDe(ing.por100, cantidad);
    }
    for (const [campo, valor] of Object.entries(nutrientes)) total[campo] = (total[campo] || 0) + valor;
    return {
      nombre,
      cantidad: Math.round(cantidad * 10) / 10,
      unidad,
      medida: ing.medida ? String(ing.medida).slice(0, 40) : null,
      calorias: Math.round(nutrientes.calorias),
      sinCalorias: Boolean(ing.sinCalorias),
      // ficha por 100 (para poder volver a editar la bebida)
      por100: ing.sinCalorias ? null : Object.fromEntries(
        CAMPOS.filter((c) => Number.isFinite(Number(ing.por100[c])) && Number(ing.por100[c]) >= 0).map((c) => [c, Number(ing.por100[c])]),
      ),
      fuente: ing.fuente ? String(ing.fuente).slice(0, 20) : null,
      referencia: ing.referencia ? String(ing.referencia).slice(0, 160) : null,
    };
  });
  return {
    ml: Math.round(validarMl(ml)),
    nutrientes: redondear(total),
    ingredientes: lista,
    fuente: fuente ? String(fuente).slice(0, 20) : lista.find((i) => i.fuente)?.fuente || null,
    referencia: null,
  };
}

// { ml, por100: { calorias, ... }, fuente, referencia } -> nutrientes de la porción
// { ml, ingredientes: [{ nombre, cantidad, unidad, medida, por100 | sinCalorias }] } -> suma
function nutricionDeBebida({ ml, por100, fuente, referencia, ingredientes } = {}) {
  if (Array.isArray(ingredientes) && ingredientes.length) return nutricionPorIngredientes({ ml, ingredientes, fuente });
  if (!por100) return null;
  const cantidad = validarMl(ml);
  const nutrientes = redondear(nutrientesDe(por100, cantidad));
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

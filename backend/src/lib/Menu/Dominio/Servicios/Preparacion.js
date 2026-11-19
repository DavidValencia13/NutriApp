const { ValidationError } = require("../Errores");

// Explicación de preparación de un plato: pasos cortos, cada uno con una
// acción (la pantalla la muestra con su ícono) y un tiempo aproximado.
// { pasos: [{ accion, texto, minutos }], minutosTotales }
const ACCIONES = ["lavar", "picar", "hervir", "cocinar", "freir", "hornear", "licuar", "mezclar", "servir"];
const MAX_PASOS = 8;
const MAX_TEXTO = 220;
const MAX_MINUTOS_PASO = 180;

function normalizarAccion(accion) {
  const limpia = String(accion || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  return ACCIONES.includes(limpia) ? limpia : "cocinar";
}

// Devuelve la preparación lista para guardar, o lanza ValidationError.
// null / sin pasos = quitar la explicación.
function normalizarPreparacion(preparacion) {
  if (preparacion === null || preparacion === undefined) return null;
  const pasosEntrada = Array.isArray(preparacion) ? preparacion : preparacion.pasos;
  if (!Array.isArray(pasosEntrada)) throw new ValidationError("La preparación debe tener una lista de pasos");

  const pasos = pasosEntrada
    .map((paso) => {
      const texto = String(paso?.texto || "").replace(/\s+/g, " ").trim();
      const minutos = Number(paso?.minutos);
      return {
        accion: normalizarAccion(paso?.accion),
        texto,
        minutos: Number.isFinite(minutos) && minutos > 0 ? Math.min(Math.round(minutos), MAX_MINUTOS_PASO) : 0,
        // paso de la bebida (se muestra aparte, después del plato)
        ...(paso?.bebida === true && { bebida: true }),
      };
    })
    .filter((paso) => paso.texto)
    .sort((a, b) => Number(Boolean(a.bebida)) - Number(Boolean(b.bebida)));

  if (pasos.length === 0) return null;
  if (pasos.length > MAX_PASOS) throw new ValidationError(`La preparación admite como máximo ${MAX_PASOS} pasos`);
  if (pasos.some((paso) => paso.texto.length > MAX_TEXTO))
    throw new ValidationError(`Cada paso admite como máximo ${MAX_TEXTO} caracteres`);

  return { pasos, minutosTotales: pasos.reduce((total, paso) => total + paso.minutos, 0) };
}

// Lo que devuelve la IA se recorta a los límites en vez de descartarse
function recortarPasosIA(pasos) {
  if (!Array.isArray(pasos)) return pasos;
  return pasos.slice(0, MAX_PASOS).map((p) => ({ ...p, texto: String(p?.texto || "").slice(0, MAX_TEXTO) }));
}

// Bebida que se prepara (jugo, batido, colada...): tiene calorías o
// ingredientes. Agua o una infusión simple no necesitan pasos.
function bebidaPreparada(comida) {
  const n = comida?.bebidaNutricion;
  return Boolean(comida?.bebida && n && ((Number(n.nutrientes?.calorias) || 0) > 0 || n.ingredientes?.length));
}

// Le falta explicación, o se explicó antes de ponerle la bebida preparada
// que tiene ahora (la preparación guarda con qué bebida se hizo)
function necesitaPreparacion(comida) {
  if (!comida?.preparacion?.pasos?.length) return true;
  return bebidaPreparada(comida) && comida.preparacion.bebida !== comida.bebida;
}

// Marca con qué bebida se hizo la explicación
function conBebida(preparacion, comida) {
  if (!preparacion) return preparacion;
  return bebidaPreparada(comida) ? { ...preparacion, bebida: comida.bebida } : preparacion;
}

module.exports = { ACCIONES, MAX_PASOS, normalizarPreparacion, recortarPasosIA, bebidaPreparada, necesitaPreparacion, conBebida };

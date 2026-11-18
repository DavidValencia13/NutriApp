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
      };
    })
    .filter((paso) => paso.texto);

  if (pasos.length === 0) return null;
  if (pasos.length > MAX_PASOS) throw new ValidationError(`La preparación admite como máximo ${MAX_PASOS} pasos`);
  if (pasos.some((paso) => paso.texto.length > MAX_TEXTO))
    throw new ValidationError(`Cada paso admite como máximo ${MAX_TEXTO} caracteres`);

  return { pasos, minutosTotales: pasos.reduce((total, paso) => total + paso.minutos, 0) };
}

module.exports = { ACCIONES, MAX_PASOS, normalizarPreparacion };

// Convierte el nivel cualitativo (bien/regular/mal) que captura el
// nutriólogo en un puntaje 0-100, para poder reutilizar el mismo criterio de
// puntaje que ya usa Efectividad (ver EvaluadorEfectividad.puntosCumplimiento).
const PUNTOS_POR_NIVEL = { bien: 100, regular: 60, mal: 20 };

// Agrega los registros de seguimiento de un paciente en un resumen simple.
// Función pura: no consulta nada, recibe ya resueltos los registros.
function calcularResumen(registros) {
  if (!registros || registros.length === 0) {
    return { totalRegistros: 0, porcentajeCumplimiento: null };
  }

  const suma = registros.reduce((acc, r) => acc + PUNTOS_POR_NIVEL[r.nivelCumplimiento], 0);

  return {
    totalRegistros: registros.length,
    porcentajeCumplimiento: Math.round(suma / registros.length),
  };
}

module.exports = { calcularResumen };

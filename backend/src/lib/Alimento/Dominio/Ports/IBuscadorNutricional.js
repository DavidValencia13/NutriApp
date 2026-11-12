class IBuscadorNutricional {
  // Devuelve { fuente, nombreEncontrado, refUnidad, refCantidad, tipoMedicion,
  // ...nutrientes (subset de CAMPOS_NUTRIENTES), alternativa? }, donde
  // `alternativa` (opcional) es el mismo formato desde otra fuente
  // o null si no se encontró ningún resultado. Nunca lanza por "sin resultados",
  // solo por fallas reales del servicio externo (ver ServicioExternoError).
  async buscar(nombreAlimento) {}
}

module.exports = IBuscadorNutricional;

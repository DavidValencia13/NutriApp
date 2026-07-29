class IBuscadorNutricional {
  // Devuelve { nombreEncontrado, refUnidad, refCantidad, ...nutrientes (subset de CAMPOS_NUTRIENTES) }
  // o null si no se encontró ningún resultado. Nunca lanza por "sin resultados",
  // solo por fallas reales del servicio externo (ver ServicioExternoError).
  async buscar(nombreAlimento) {}
}

module.exports = IBuscadorNutricional;

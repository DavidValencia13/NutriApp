// Porcentaje de la meta desde el cual se considera que los alimentos alcanzan
export const UMBRAL_SUFICIENTE = 95;

// true si los alimentos registrados no alcanzan para la meta de calorías o
// proteínas del paciente (suficiencia la calcula el backend en la cobertura)
export function faltanAlimentos(suficiencia) {
  if (!suficiencia) return false;
  return [suficiencia.calorias?.porcentaje, suficiencia.proteinas?.porcentaje].some(
    (p) => p !== null && p !== undefined && p < UMBRAL_SUFICIENTE,
  );
}

export function catalogoPreparadoParaMenu(cobertura, cantidadAlimentos) {
  if (!cobertura || cantidadAlimentos < 1 || !cobertura.listoParaMenu) return false;
  const suficiencia = cobertura.suficiencia;
  return !faltanAlimentos(suficiencia) &&
    !suficiencia?.alimentosSinDatos?.length &&
    !suficiencia?.alimentosSinPeso?.length;
}

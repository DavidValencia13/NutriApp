import apiFetch from "./api";

// Indicador de efectividad de la dieta (combina cumplimiento, evolución de
// peso y alertas nutricionales pendientes). Solo apoyo: la decisión final
// sobre la dieta siempre es del nutriólogo.
export async function obtenerEfectividad(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/efectividad`);
}

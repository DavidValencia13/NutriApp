import apiFetch from "./api";

// Trae las recomendaciones nutricionales del paciente (RF-0012)
export async function listarRecomendaciones(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/recomendacion`);
}

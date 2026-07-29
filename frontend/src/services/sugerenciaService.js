import apiFetch from "./api";

// Trae las sugerencias de apoyo para completar el menú (nutrientes o grupos
// deficitarios + alimentos del catálogo del paciente que podrían cubrirlos).
// Nunca modifica el menú: es apoyo profesional, el nutriólogo decide.
export async function listarSugerencias(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/sugerencia`);
}

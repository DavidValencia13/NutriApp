import apiFetch from "./api";

// Reporte nutricional completo del menú: datos del paciente, dieta, valores
// nutricionales, alertas, evolución, cumplimiento, efectividad y
// recomendaciones para la siguiente consulta (RF punto 9). Agrega en un
// solo documento lo que ya calculan los demás módulos.
export async function obtenerReporte(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/reporte`);
}

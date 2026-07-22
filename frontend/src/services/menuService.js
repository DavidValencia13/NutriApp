import apiFetch from "./api";

// Genera un nuevo menú semanal para el paciente (RF-008)
export async function generarMenu(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/menu/generar`, { method: "POST" });
}

// Trae el menú más reciente del paciente (RF-009 / RF-0010)
export async function obtenerMenu(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/menu`);
}

// Ajusta una comida puntual del menú (RF-0011)
export async function ajustarComida(idPaciente, idComidaMenu, cambios) {
  return await apiFetch(`/paciente/${idPaciente}/menu/comida/${idComidaMenu}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

// Aprueba el menú (cierra el bucle de revisión del BPM)
export async function aprobarMenu(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/aprobar`, { method: "POST" });
}

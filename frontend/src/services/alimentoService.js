import apiFetch from "./api";

// Trae todos los alimentos de un paciente
export async function listarAlimentos(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/alimento`);
}

// Registra un nuevo alimento del paciente (RF-005)
export async function registrarAlimento(idPaciente, datos) {
  return await apiFetch(`/paciente/${idPaciente}/alimento`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Edita un alimento existente del paciente (RF-006)
export async function editarAlimento(idPaciente, idAlimento, datos) {
  return await apiFetch(`/paciente/${idPaciente}/alimento/${idAlimento}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// Elimina un alimento del paciente (RF-007)
export async function eliminarAlimento(idPaciente, idAlimento) {
  return await apiFetch(`/paciente/${idPaciente}/alimento/${idAlimento}`, {
    method: "DELETE",
  });
}

import apiFetch from "./api";

// Trae todos los pacientes del nutriólogo logueado (RF-004)
export async function listarPacientes() {
  return await apiFetch("/paciente");
}

// Registra un nuevo paciente (RF-001)
export async function registrarPaciente(datos) {
  return await apiFetch("/paciente", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Edita un paciente existente (RF-002)
export async function editarPaciente(id, datos) {
  return await apiFetch(`/paciente/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// Elimina un paciente (RF-003)
export async function eliminarPaciente(id) {
  return await apiFetch(`/paciente/${id}`, {
    method: "DELETE",
  });
}
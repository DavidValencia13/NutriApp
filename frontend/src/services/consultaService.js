import apiFetch from "./api";

// Trae el historial de consultas (mediciones) de un paciente, en orden cronológico
export async function listarConsultas(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/consulta`);
}

// Registra una nueva consulta (medición puntual) del paciente
export async function registrarConsulta(idPaciente, datos) {
  return await apiFetch(`/paciente/${idPaciente}/consulta`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Elimina una consulta (ej. se registró mal)
export async function eliminarConsulta(idPaciente, idConsulta) {
  return await apiFetch(`/paciente/${idPaciente}/consulta/${idConsulta}`, {
    method: "DELETE",
  });
}

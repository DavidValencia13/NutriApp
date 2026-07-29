import apiFetch from "./api";

// Trae la bitácora de seguimiento (fecha/peso/nivel de cumplimiento) de un paciente, en orden cronológico
export async function listarSeguimiento(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/seguimiento`);
}

// Registra un nuevo punto de seguimiento del paciente
export async function registrarSeguimiento(idPaciente, datos) {
  return await apiFetch(`/paciente/${idPaciente}/seguimiento`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Elimina un registro de seguimiento (ej. se capturó mal)
export async function eliminarSeguimiento(idPaciente, idRegistro) {
  return await apiFetch(`/paciente/${idPaciente}/seguimiento/${idRegistro}`, {
    method: "DELETE",
  });
}

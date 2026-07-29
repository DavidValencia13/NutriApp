import apiFetch from "./api";

// Registra el cumplimiento de un día del menú (lo captura el nutriólogo en
// consulta — el paciente no tiene cuenta propia en la app hoy).
export async function registrarCumplimiento(idPaciente, idMenu, datos) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/cumplimiento`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function listarCumplimiento(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/cumplimiento`);
}

// Resumen agregado (% de cumplimiento, promedios, síntomas reportados) de
// todos los registros del menú.
export async function obtenerResumenCumplimiento(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/cumplimiento/resumen`);
}

export async function eliminarCumplimiento(idPaciente, idMenu, idRegistro) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/cumplimiento/${idRegistro}`, {
    method: "DELETE",
  });
}

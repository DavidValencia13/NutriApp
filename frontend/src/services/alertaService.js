import apiFetch from "./api";

// Trae las alertas (pendientes y resueltas) de un menú
export async function listarAlertas(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/alerta`);
}

// Registra la decisión del nutriólogo sobre una alerta: aceptada, corregida
// o ignorada, con una observación opcional. Queda fija para ese menú.
export async function resolverAlerta(idPaciente, idMenu, idAlerta, { estado, observacion }) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/alerta/${idAlerta}`, {
    method: "PATCH",
    body: JSON.stringify({ estado, observacion }),
  });
}

import apiFetch from "./api";

/**
 * Envía un mensaje al asistente nutricional.
 *
 * @param {object} params
 * @param {number|null} params.idPaciente - ID del paciente (null para consultas generales).
 * @param {string} params.mensaje - Mensaje del usuario.
 * @param {Array<{rol: "usuario"|"asistente", contenido: string}>} params.historial
 * @returns {Promise<{respuesta: string, proveedor: string}>}
 */
export async function chatAsistente({ idPaciente, mensaje, historial = [] }) {
  return apiFetch("/asistente/chat", {
    method: "POST",
    body: JSON.stringify({ idPaciente, mensaje, historial }),
  });
}

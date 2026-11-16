import apiFetch from "./api";

// ── App del paciente (sesión de paciente) ──
export const obtenerPerfilPortal = () => apiFetch("/portal/perfil");
export const obtenerMenuPortal = () => apiFetch("/portal/menu");
export const obtenerComprasPortal = () => apiFetch("/portal/compras");
export const obtenerProgresoPortal = () => apiFetch("/portal/progreso");

// estado: "si" | "parte" | "no" | null (null quita la marca)
export const marcarComida = (idComidaMenu, estado, nota) =>
  apiFetch(`/portal/comidas/${idComidaMenu}/marca`, {
    method: "PUT",
    body: JSON.stringify({ estado, nota }),
  });

export const registrarPesoPortal = (peso, nota) =>
  apiFetch("/portal/peso", { method: "POST", body: JSON.stringify({ peso, nota }) });

export const buscarAlimentosDiario = (texto) =>
  apiFetch(`/portal/alimentos?q=${encodeURIComponent(texto)}`);
export const listarIngestasPortal = () => apiFetch("/portal/ingestas");
export const registrarIngestaPortal = (datos) =>
  apiFetch("/portal/ingestas", { method: "POST", body: JSON.stringify(datos) });
export const eliminarIngestaPortal = (id) =>
  apiFetch(`/portal/ingestas/${id}`, { method: "DELETE" });

// ── Nutriólogo: acceso del paciente a la app y su cumplimiento ──
export const obtenerAccesoPaciente = (idPaciente) => apiFetch(`/paciente/${idPaciente}/acceso`);
export const guardarAccesoPaciente = (idPaciente, datos) =>
  apiFetch(`/paciente/${idPaciente}/acceso`, { method: "PUT", body: JSON.stringify(datos) });
export const quitarAccesoPaciente = (idPaciente) =>
  apiFetch(`/paciente/${idPaciente}/acceso`, { method: "DELETE" });
export const obtenerCumplimientoPaciente = (idPaciente) => apiFetch(`/paciente/${idPaciente}/cumplimiento`);
export const listarIngestasPaciente = (idPaciente) => apiFetch(`/paciente/${idPaciente}/ingestas`);

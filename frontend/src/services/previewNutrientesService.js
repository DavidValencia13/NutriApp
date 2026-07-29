import apiFetch from "./api";

// Calcula los nutrientes de una comida EN CONSTRUCCIÓN (sin guardarla) y
// devuelve además sugerencias de qué le falta. Se usa para el feedback en
// vivo del formulario de ajuste de comida.
export async function calcularPreviewNutrientes(idPaciente, idMenu, alimentos) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/preview-nutrientes`, {
    method: "POST",
    body: JSON.stringify({ alimentos }),
  });
}

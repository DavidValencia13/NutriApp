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

// Guía de cobertura del catálogo: qué grupos/nutrientes le faltan al paciente
// para poder armarle una dieta balanceada. Se recalcula en el backend en cada
// llamada, así que hay que volver a pedirla tras crear/editar/eliminar.
export async function obtenerCoberturaCatalogo(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/alimento/cobertura`);
}

// Busca información nutricional sugerida en USDA FoodData Central (o null
// si no se encontró nada / falló el servicio externo). Nunca guarda nada.
export async function buscarInfoNutricional(idPaciente, nombre) {
  return await apiFetch(
    `/paciente/${idPaciente}/alimento/buscar-nutricion?nombre=${encodeURIComponent(nombre)}`,
  );
}

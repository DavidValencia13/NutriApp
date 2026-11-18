import apiFetch from "./api";

// Genera un nuevo menú semanal para el paciente (RF-008)
export async function generarMenu(idPaciente, { confirmarNuevaVersion = false, idVersionActual = null } = {}) {
  return await apiFetch(`/paciente/${idPaciente}/menu/generar`, {
    method: "POST",
    body: JSON.stringify({ confirmarNuevaVersion, idVersionActual }),
  });
}

// Trae el menú más reciente del paciente (RF-009 / RF-0010)
export async function obtenerMenu(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/menu`);
}

export async function listarHistorialMenu(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/menu/historial`);
}

export async function obtenerVersionMenu(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/historial/${idMenu}`);
}

// Ajusta una comida puntual del menú (RF-0011)
export async function ajustarComida(idPaciente, idComidaMenu, cambios) {
  return await apiFetch(`/paciente/${idPaciente}/menu/comida/${idComidaMenu}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

// Aprueba (finaliza) el menú.
export async function aprobarMenu(idPaciente, idMenu) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/aprobar`, {
    method: "POST",
  });
}


// Explicación de preparación: la IA escribe los pasos de los platos que no
// la tienen (o de todos con regenerar). Devuelve { preparaciones, generadas }
export async function generarPreparacion(idPaciente, idMenu, { regenerar = false, idsComidas = null } = {}) {
  return await apiFetch(`/paciente/${idPaciente}/menu/${idMenu}/preparacion`, {
    method: "POST",
    body: JSON.stringify({ regenerar, idsComidas }),
  });
}

// El nutricionista corrige (o quita, con null) los pasos de un plato
export async function guardarPreparacion(idPaciente, idComidaMenu, preparacion) {
  return await apiFetch(`/paciente/${idPaciente}/menu/comida/${idComidaMenu}/preparacion`, {
    method: "PUT",
    body: JSON.stringify({ preparacion }),
  });
}

// Cómo se calculó la meta de calorías (fórmula y pasos) y los macronutrientes
export async function obtenerRequerimiento(idPaciente) {
  return await apiFetch(`/paciente/${idPaciente}/menu/requerimiento`);
}

// Bebida que acompaña una comida: { bebida } o, si tiene calorías,
// { bebida, ml, por100, fuente, referencia } ({ bebida: null } = quitarla)
export async function guardarBebida(idPaciente, idComidaMenu, datos) {
  return await apiFetch(`/paciente/${idPaciente}/menu/comida/${idComidaMenu}/bebida`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

import apiFetch from "./api";

// Llama al endpoint de login de tu backend
export async function login(email, password) {
  return await apiFetch("/nutriologo/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
// Login del paciente con el correo y la contraseña que le creó su nutriólogo
export async function loginPaciente(email, password) {
  return await apiFetch("/portal/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Crear cuenta de nutricionista (en la página publicada pide código de invitación)
export async function registrarNutriologo(datos) {
  return await apiFetch("/nutriologo/registrar", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

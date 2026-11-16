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

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

export async function registrarNutriologo(datos) {
  return apiFetch("/nutriologo/registrar", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function obtenerWhatsappNutriologo() {
  return apiFetch("/nutriologo/me/whatsapp");
}

export async function guardarWhatsappNutriologo(numero) {
  return apiFetch("/nutriologo/me/whatsapp", {
    method: "PUT",
    body: JSON.stringify({ numero }),
  });
}

// "Personalizar diseño": nombre de la consulta, color y logo que ve el paciente
export async function obtenerMarcaNutriologo() {
  return apiFetch("/nutriologo/me/marca");
}

export async function guardarMarcaNutriologo(marca) {
  return apiFetch("/nutriologo/me/marca", {
    method: "PUT",
    body: JSON.stringify(marca),
  });
}

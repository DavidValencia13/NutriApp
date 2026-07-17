import apiFetch from "./api";

// Llama al endpoint de login de tu backend
export async function login(email, password) {
  return await apiFetch("/nutriologo/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
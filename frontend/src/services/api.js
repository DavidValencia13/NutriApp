// URL base de tu backend (todo lo que armamos: nutriologo, paciente, etc.)
// En la página publicada viene de VITE_API_URL (se configura en Cloudflare
// Pages); en la computadora local, el backend de siempre.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Función genérica para hacer peticiones al backend
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token"); // el token guardado tras el login

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Si hay token guardado, lo mandamos en el header Authorization
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // El servidor gratis de la nube se duerme si nadie lo usa: si tarda más de
  // 5 s se avisa "Conectando..." (menos al generar menú, que tiene su propia espera)
  const avisar = !endpoint.endsWith("/generar");
  const temporizador = avisar
    ? setTimeout(() => window.dispatchEvent(new CustomEvent("servidor-lento", { detail: true })), 5000)
    : null;

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu internet e inténtalo de nuevo.");
  } finally {
    if (temporizador) {
      clearTimeout(temporizador);
      window.dispatchEvent(new CustomEvent("servidor-lento", { detail: false }));
    }
  }

  const data = await response.json().catch(() => null);
  // (catch vacío por si la respuesta no trae JSON, ej: en un DELETE con 204)

  // Token vencido o inválido: se avisa a AuthContext para volver al login.
  // Solo si se envió token, porque un login fallido también responde 401.
  if (response.status === 401 && token) {
    window.dispatchEvent(new Event("sesion-expirada"));
  }

  if (!response.ok) {
    // Si el backend respondió con error (400, 401, etc.), lanzamos ese mensaje
    throw new Error(data?.message || "Error en la petición");
  }

  return data;
}

export default apiFetch;

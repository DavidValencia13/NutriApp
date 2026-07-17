// URL base de tu backend (todo lo que armamos: nutriologo, paciente, etc.)
const API_URL = "http://localhost:3000/api";

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  // (catch vacío por si la respuesta no trae JSON, ej: en un DELETE con 204)

  if (!response.ok) {
    // Si el backend respondió con error (400, 401, etc.), lanzamos ese mensaje
    throw new Error(data?.message || "Error en la petición");
  }

  return data;
}

export default apiFetch;
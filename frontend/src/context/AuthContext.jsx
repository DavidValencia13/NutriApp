import { createContext, useContext, useState } from "react";
import { login as loginService } from "../services/authService";

// Context (mecanismo de React para compartir datos entre componentes
// sin pasarlos manualmente por props en cada nivel)
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Al cargar la app, revisa si ya había un nutriólogo logueado antes
  const [nutriologo, setNutriologo] = useState(() => {
    const guardado = localStorage.getItem("nutriologo");
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(email, password) {
    const data = await loginService(email, password);
    // Guarda el token y los datos del nutriólogo en localStorage
    // (así si recarga la página, sigue logueado)
    localStorage.setItem("token", data.token);
    localStorage.setItem("nutriologo", JSON.stringify(data.nutriologo));
    setNutriologo(data.nutriologo);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("nutriologo");
    setNutriologo(null);
  }

  return (
    <AuthContext.Provider value={{ nutriologo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook (función especial de React que "engancha" funcionalidad reutilizable)
// para que cualquier componente use fácilmente: const { nutriologo, login } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
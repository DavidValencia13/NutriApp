import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { login as loginService, loginPaciente as loginPacienteService } from "../services/authService";

// Context (mecanismo de React para compartir datos entre componentes
// sin pasarlos manualmente por props en cada nivel)
const AuthContext = createContext(null);

function leer(clave) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

// Hay dos tipos de sesión: la del nutriólogo (su panel de pacientes) y la del
// paciente (su app con el menú aprobado). Solo una a la vez.
export function AuthProvider({ children }) {
  const [nutriologo, setNutriologo] = useState(() => leer("nutriologo"));
  const [paciente, setPaciente] = useState(() => leer("paciente"));

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("nutriologo");
    localStorage.removeItem("paciente");
    setNutriologo(null);
    setPaciente(null);
  }, []);

  async function login(email, password) {
    const data = await loginService(email, password);
    logout();
    localStorage.setItem("token", data.token);
    localStorage.setItem("nutriologo", JSON.stringify(data.nutriologo));
    setNutriologo(data.nutriologo);
  }

  async function loginPaciente(email, password) {
    const data = await loginPacienteService(email, password);
    logout();
    localStorage.setItem("token", data.token);
    localStorage.setItem("paciente", JSON.stringify(data.paciente));
    setPaciente(data.paciente);
  }

  // api.js emite "sesion-expirada" cuando el backend rechaza el token
  useEffect(() => {
    window.addEventListener("sesion-expirada", logout);
    return () => window.removeEventListener("sesion-expirada", logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ nutriologo, paciente, login, loginPaciente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook (función especial de React que "engancha" funcionalidad reutilizable)
// para que cualquier componente use fácilmente: const { nutriologo, login } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

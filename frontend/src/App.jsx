import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import PortalPaciente from "./pages/PortalPaciente";

function App() {
  const { nutriologo, paciente } = useAuth();

  // El paciente entra a su propia app (solo ve su menú aprobado)
  if (paciente) {
    return <PortalPaciente />;
  }

  if (!nutriologo) {
    return <Login />;
  }

  return (
    <Pacientes />
  );
}

export default App;

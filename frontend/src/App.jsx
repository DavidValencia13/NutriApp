import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import Sidebar from "./components/Sidebar";
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
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Pacientes />
      </div>
    </div>
  );
}

export default App;

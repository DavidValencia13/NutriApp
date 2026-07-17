import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";

function App() {
  const { nutriologo, logout } = useAuth();

  if (!nutriologo) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-nutri-teal">NutriApp</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hola, {nutriologo.nombre}
          </span>
          <button
            onClick={logout}
            className="bg-nutri-pink text-white px-3 py-1 rounded text-sm hover:opacity-90"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <Pacientes />
    </div>
  );
}

export default App;

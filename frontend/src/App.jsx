import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

function App() {
  const { nutriologo } = useAuth();
  const [busqueda, setBusqueda] = useState("");

  if (!nutriologo) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar busqueda={busqueda} onBusquedaChange={setBusqueda} />
        <main className="flex-1 overflow-y-auto">
          <Pacientes busqueda={busqueda} />
        </main>
      </div>
    </div>
  );
}

export default App;

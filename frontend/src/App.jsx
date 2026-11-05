import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import Sidebar from "./components/Sidebar";

function App() {
  const { nutriologo } = useAuth();

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

import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import Topbar from "./components/Topbar";

function App() {
  const { nutriologo } = useAuth();

  if (!nutriologo) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <main>
        <Pacientes />
      </main>
    </div>
  );
}

export default App;

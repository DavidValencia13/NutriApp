import { useAuth } from "../context/AuthContext";
import { IconUsers, IconLogout } from "./Icons";

function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold text-nutri-teal">NutriApp</h1>
      </div>

      <nav className="flex-1 px-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-nutri-teal text-white font-medium">
          <IconUsers />
          <span>Pacientes</span>
        </div>
      </nav>

      <div className="px-3 pb-6 border-t border-gray-100 pt-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-nutri-pink hover:bg-red-50 w-full text-left"
        >
          <IconLogout />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

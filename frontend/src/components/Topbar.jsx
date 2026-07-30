import { useAuth } from "../context/AuthContext";
import { IconLogout } from "./Icons";

function iniciales(nombre = "", apellido = "") {
  const a = nombre.trim().charAt(0);
  const b = apellido.trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

function Topbar() {
  const { nutriologo, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nutri-teal text-lg font-bold text-white shadow-sm">
            N
          </div>
          <div>
            <p className="text-lg font-bold leading-none text-nutri-navy">NutriApp</p>
            <p className="mt-1 hidden text-[11px] text-slate-500 sm:block">
              Gestión nutricional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold text-nutri-navy">
            {nutriologo?.nombre} {nutriologo?.apellido}
          </p>
            <p className="text-xs text-slate-500">Nutriólogo</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nutri-teal/10 text-sm font-bold text-nutri-teal">
            {iniciales(nutriologo?.nombre, nutriologo?.apellido)}
          </div>
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-nutri-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nutri-teal/40"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

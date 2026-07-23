import { useAuth } from "../context/AuthContext";
import { IconSearch } from "./Icons";

function iniciales(nombre = "", apellido = "") {
  const a = nombre.trim().charAt(0);
  const b = apellido.trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

function Topbar({ busqueda, onBusquedaChange }) {
  const { nutriologo } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between gap-6">
      <div className="relative flex-1 max-w-md">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar pacientes..."
          className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nutri-teal/40"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-nutri-navy">
            {nutriologo?.nombre} {nutriologo?.apellido}
          </p>
          <p className="text-xs text-gray-500">Nutricionista</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-nutri-teal text-white flex items-center justify-center font-semibold">
          {iniciales(nutriologo?.nombre, nutriologo?.apellido)}
        </div>
      </div>
    </header>
  );
}

export default Topbar;

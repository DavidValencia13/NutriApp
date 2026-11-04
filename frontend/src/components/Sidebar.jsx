import { useAuth } from "../context/AuthContext";
import { IconUsers, IconLogout } from "./Icons";
import { Logo } from "./Logo";

function iniciales(nombre = "", apellido = "") {
  return ((nombre[0] || "") + (apellido[0] || "")).toUpperCase() || "?";
}

function Sidebar() {
  const { nutriologo, logout } = useAuth();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col bg-nutri-ink text-white"
      style={{ height: "100vh", position: "sticky", top: 0 }}
    >
      {/* Marca */}
      <div className="px-5 h-16 flex items-center border-b border-white/10">
        <Logo size={30} light />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-5">
        <NavItem icon={<IconUsers />} label="Pacientes" active />

        <p className="px-3 mt-7 mb-2 text-xs text-white/40">Próximamente</p>
        <NavItem icon={<IconChart />}    label="Reportes"        disabled />
        <NavItem icon={<IconCalendar />} label="Consultas"       disabled />
        <NavItem icon={<IconBrain />}    label="Inteligencia IA" disabled />
      </nav>

      {/* Usuario */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center rounded-full bg-nutri-mint text-nutri-ink text-xs font-bold shrink-0 w-9 h-9">
            {iniciales(nutriologo?.nombre, nutriologo?.apellido)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold truncate">
              {nutriologo?.nombre} {nutriologo?.apellido}
            </p>
            <p className="text-xs text-white/50">Nutriólogo/a</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex items-center justify-center w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, disabled }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 text-sm transition-colors ${
        active
          ? "bg-white/10 text-white font-semibold"
          : disabled
            ? "text-white/35 cursor-default"
            : "text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
      }`}
    >
      <span className={`flex ${active ? "text-nutri-mint" : ""}`}>{icon}</span>
      <span className="flex-1">{label}</span>
    </div>
  );
}

/* ── Placeholder icons for future nav items ─── */
function IconChart(props) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="2 14 6 9 10 12 14 7 18 11" />
      <line x1="2" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="6"  y1="2" x2="6"  y2="6" />
      <line x1="2"  y1="9" x2="18" y2="9" />
    </svg>
  );
}

function IconBrain(props) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 3C7 3 5 5 5 7.5c0 1 .5 2 1 2.5C4.5 11 4 12 4 13c0 2 2 4 4 4h4c2 0 4-2 4-4 0-1-.5-2-2-2.5.5-.5 1-1.5 1-2.5C15 5 13 3 10 3z"/>
      <line x1="10" y1="9" x2="10" y2="13"/>
    </svg>
  );
}

export default Sidebar;

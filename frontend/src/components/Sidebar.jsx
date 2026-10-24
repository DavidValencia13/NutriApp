import { useAuth } from "../context/AuthContext";
import { IconUsers, IconLogout } from "./Icons";

function iniciales(nombre = "", apellido = "") {
  return ((nombre[0] || "") + (apellido[0] || "")).toUpperCase() || "?";
}

function Sidebar() {
  const { nutriologo, logout } = useAuth();

  return (
    <aside
      className="sidebar-shell w-64 shrink-0 flex flex-col"
      style={{ height: "100vh", position: "sticky", top: 0 }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(56,189,248,0.07)" }}
      >
        <div
          className="font-display font-bold text-white flex items-center justify-center flex-shrink-0"
          style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #0ECFC7 0%, #0BA89F 100%)",
            borderRadius: 11,
            fontSize: 17,
            boxShadow: "0 4px 16px rgba(14,207,199,0.35)",
          }}
        >
          N
        </div>
        <div>
          <p
            className="font-display font-bold leading-none"
            style={{ color: "#E2E8F0", fontSize: 15, letterSpacing: "-0.3px" }}
          >
            NutriApp
          </p>
          <p
            className="mt-1 uppercase tracking-[0.12em]"
            style={{ fontSize: 9, color: "rgba(100,116,139,0.8)" }}
          >
            Plataforma nutricional
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p
          className="px-3 mb-2 uppercase tracking-widest font-semibold"
          style={{ fontSize: 10, color: "rgba(100,116,139,0.6)" }}
        >
          Módulos
        </p>

        <NavItem icon={<IconUsers />} label="Pacientes" badge="12" active />

        <div className="mt-6">
          <p
            className="px-3 mb-2 uppercase tracking-widest font-semibold"
            style={{ fontSize: 10, color: "rgba(100,116,139,0.6)" }}
          >
            Próximamente
          </p>

          <NavItem icon={<IconChart />}     label="Reportes"    disabled />
          <NavItem icon={<IconCalendar />}  label="Consultas"   disabled />
          <NavItem icon={<IconBrain />}     label="Inteligencia IA" disabled accent="indigo" />
        </div>
      </nav>

      {/* User */}
      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid rgba(56,189,248,0.07)" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all duration-200"
          style={{ cursor: "default" }}
        >
          <div
            className="flex items-center justify-center text-white font-semibold flex-shrink-0"
            style={{
              width: 34, height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ECFC7, #818CF8)",
              fontSize: 12,
            }}
          >
            {iniciales(nutriologo?.nombre, nutriologo?.apellido)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="font-semibold truncate leading-none"
              style={{ fontSize: 13, color: "#E2E8F0" }}
            >
              {nutriologo?.nombre} {nutriologo?.apellido}
            </p>
            <p className="mt-0.5" style={{ fontSize: 11, color: "#475569" }}>
              Nutriólogo/a
            </p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              width: 30, height: 30,
              color: "#475569",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.12)"; e.currentTarget.style.color = "#F43F5E"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, badge, active, disabled, accent }) {
  const accentColor = accent === "indigo" ? "#818CF8" : "#0ECFC7";

  return (
    <div
      className={`nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 ${active ? "nav-item-active" : ""}`}
      style={{
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: active ? accentColor : "rgba(148,163,184,0.8)",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
      }}
    >
      <span
        style={{
          color: active ? accentColor : "rgba(100,116,139,0.9)",
          display: "flex",
        }}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className="font-bold"
          style={{
            fontSize: 11,
            background: "rgba(14,207,199,0.12)",
            color: "#0ECFC7",
            padding: "2px 8px",
            borderRadius: 20,
          }}
        >
          {badge}
        </span>
      )}
      {disabled && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "rgba(148,163,184,0.1)",
            color: "rgba(148,163,184,0.5)",
            padding: "2px 6px",
            borderRadius: 20,
          }}
        >
          Pronto
        </span>
      )}
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

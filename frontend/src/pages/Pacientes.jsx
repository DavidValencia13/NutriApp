import { useState, useEffect } from "react";
import { listarPacientes, eliminarPaciente, crearPacienteDemo } from "../services/pacienteService";
import { obtenerCoberturaCatalogo } from "../services/alimentoService";
import { obtenerMenu } from "../services/menuService";
import { faltanAlimentos } from "../utils/suficiencia";
import Modal from "../components/Modal";
import FormularioPaciente from "../components/FormularioPaciente";
import MenuPaciente from "../components/MenuPaciente";
import SeguimientoPaciente from "../components/SeguimientoPaciente";
import FloatingAssistant from "../components/FloatingAssistant";
import MiniSeguimiento from "../components/MiniSeguimiento";
import AccesoPaciente from "../components/AccesoPaciente";
import PersonalizarDiseno from "../components/PersonalizarDiseno";
import { BrainCircuit, CalendarCheck2, Ellipsis, HeartPulse, Palette, Ruler, ShieldAlert, Smartphone, UserRound, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import HeroCarousel from "../components/HeroCarousel";
import RecorridoGuiado from "../components/RecorridoGuiado";
import { PASOS_GUIA_NUTRICIONISTA } from "../utils/guiaNutricionista";
import {
  IconUsers,
  IconPlus,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconLeaf,
  IconSearch,
  IconLogout,
} from "../components/Icons";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase() || "?";
}

function InicioNavIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="13" y="3" width="8" height="4" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="7" height="8" rx="1.5" />
    </svg>
  );
}

function ExpedientesNavIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.5h6l2 2h10v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" />
      <path d="M7 12.5h5M7 16h4M16.5 12v5M14 14.5h5" />
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
function Pacientes() {
  const { nutriologo, logout } = useAuth();
  const [pacientes, setPacientes]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState("");
  const [busqueda, setBusqueda]     = useState("");
  const [modal, setModal]           = useState({ tipo: null, paciente: null });
  const [coberturas, setCoberturas] = useState({});
  const [estadosMenu, setEstadosMenu] = useState({});
  const [filtro, setFiltro]         = useState("todos");
  const [seccionActiva, setSeccionActiva] = useState(() => window.location.hash === "#listado-pacientes" ? "pacientes" : "inicio");
  const claveGuia = `guia-vista-${nutriologo?.id}`;
  const [guiaVista, setGuiaVista] = useState(() => {
    try { return localStorage.getItem(`guia-vista-${nutriologo?.id}`) === "1"; }
    catch { return true; }
  });
  const [guiaManual, setGuiaManual] = useState(false);
  function cerrarGuia() {
    setGuiaManual(false);
    setGuiaVista(true);
    try { localStorage.setItem(claveGuia, "1"); } catch { /* almacenamiento opcional */ }
  }

  useEffect(() => { cargarPacientes(); }, []);
  useEffect(() => {
    const actualizarSeccion = () => setSeccionActiva(window.location.hash === "#listado-pacientes" ? "pacientes" : "inicio");
    window.addEventListener("hashchange", actualizarSeccion);
    return () => window.removeEventListener("hashchange", actualizarSeccion);
  }, []);

  async function cargarPacientes() {
    setCargando(true);
    setError("");
    setCoberturas({});
    setEstadosMenu({});
    try {
      const data = await listarPacientes();
      setPacientes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este paciente?")) return;
    try {
      await eliminarPaciente(id);
      cargarPacientes();
    } catch (err) {
      setError(err.message);
    }
  }

  // Al cerrar un modal (ej. después de registrar alimentos) las tarjetas
  // vuelven a revisar si los alimentos alcanzan
  const [versionCobertura, setVersionCobertura] = useState(0);
  useEffect(() => {
    let vigente = true;
    Promise.all([
      Promise.allSettled(pacientes.map((p) => obtenerCoberturaCatalogo(p.id))),
      Promise.allSettled(pacientes.map((p) => obtenerMenu(p.id))),
    ]).then(([coberturasResultado, menusResultado]) => {
      if (!vigente) return;
      setCoberturas(Object.fromEntries(coberturasResultado.map((resultado, index) => [
        pacientes[index].id,
        resultado.status === "fulfilled" ? resultado.value?.suficiencia || null : null,
      ])));
      setEstadosMenu(Object.fromEntries(menusResultado.map((resultado, index) => [
        pacientes[index].id,
        resultado.status === "fulfilled" ? resultado.value?.estado || null : undefined,
      ])));
    });
    return () => { vigente = false; };
  }, [pacientes, versionCobertura]);

  const cerrarModal  = ()  => {
    setModal({ tipo: null, paciente: null });
    setCoberturas({});
    setVersionCobertura((v) => v + 1);
  };
  const handleSuccessFormularioPaciente = () => { cerrarModal(); cargarPacientes(); };

  const conCobertura = pacientes.filter((p) => [
    coberturas[p.id]?.calorias?.porcentaje,
    coberturas[p.id]?.proteinas?.porcentaje,
  ].every(Number.isFinite));
  const conAlerta = conCobertura.filter((p) => faltanAlimentos(coberturas[p.id])).length;
  const conCatalogoSuficiente = conCobertura.length - conAlerta;
  const menusEnElaboracion = pacientes.filter((p) => Object.hasOwn(estadosMenu, p.id) && estadosMenu[p.id] !== undefined && estadosMenu[p.id] !== "aprobado").length;
  const menusTerminados = pacientes.filter((p) => estadosMenu[p.id] === "aprobado").length;
  const resumenMenusDisponible = pacientes.every((p) => Object.hasOwn(estadosMenu, p.id) && estadosMenu[p.id] !== undefined);
  const coberturaLista = pacientes.length === 0 || pacientes.every((p) => Object.hasOwn(coberturas, p.id));
  const resumenCoberturaDisponible = coberturaLista && conCobertura.length === pacientes.length;
  const pacientesFiltrados = pacientes.filter((p) => {
    const coincide = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
    if (filtro === "alertas") return coincide && Object.hasOwn(estadosMenu, p.id) && estadosMenu[p.id] !== undefined && estadosMenu[p.id] !== "aprobado";
    if (filtro === "suficientes") return coincide && estadosMenu[p.id] === "aprobado";
    return coincide;
  });

  const tituloModal =
    modal.tipo === "paciente"
      ? modal.paciente ? "Editar paciente" : "Nuevo paciente"
      : modal.tipo === "menu"
          ? `Menú — ${modal.paciente?.nombre}`
          : modal.tipo === "seguimiento"
            ? `Seguimiento — ${modal.paciente?.nombre}`
            : modal.tipo === "acceso"
              ? `Acceso a la app — ${modal.paciente?.nombre}`
              : modal.tipo === "diseno"
                ? "Personalizar diseño"
                : "";

  const conteo = busqueda.trim() || filtro !== "todos"
    ? `${pacientesFiltrados.length} resultado${pacientesFiltrados.length !== 1 ? "s" : ""}`
    : `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}`;

  return (
    <div className="dashboard-page min-h-screen bg-surface">
      <aside className="dashboard-rail" aria-label="Navegación de NutriApp">
          <div className="rail-brand"><Logo size={44} light /><span>CONSULTA DIGITAL</span></div>
          <nav className="rail-nav" aria-label="Secciones de Pacientes">
            <a href="#resumen" aria-current={seccionActiva === "inicio" ? "page" : undefined} onClick={() => setSeccionActiva("inicio")}><InicioNavIcon /> <span>Inicio</span></a>
            <a href="#listado-pacientes" aria-current={seccionActiva === "pacientes" ? "page" : undefined} onClick={() => setSeccionActiva("pacientes")}><ExpedientesNavIcon /> <span>Pacientes</span></a>
          </nav>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-stage-main">
          <header className="dashboard-topbar">
            <div className="topbar-greeting">
              <span className="topbar-eyebrow"><span className="live-dot" /> ESPACIO PROFESIONAL</span>
              <h1>Hola, {nutriologo?.nombre || "profesional"} <span aria-hidden="true">👋</span></h1>
            </div>
            <div className="topbar-note"><span className="topbar-note-icon"><IconLeaf /></span><span>Tu consulta, <strong>con claridad.</strong></span></div>
            <div className="topbar-actions">
              <button type="button" className="topbar-guide-link" data-tour="ver-guia" onClick={() => setGuiaManual(true)}>Guía</button>
              <button type="button" className="topbar-guide-link topbar-design-link" onClick={() => setModal({ tipo: "diseno", paciente: null })} title="Elige el color, el nombre y el logo que verán tus pacientes en su app">
                <Palette size={15} aria-hidden="true" /> Personalizar diseño
              </button>
              <button type="button" className="primary-button" data-tour="nuevo-paciente" onClick={() => setModal({ tipo: "paciente", paciente: null })}>
                <IconPlus /> Nuevo paciente
              </button>
              <button type="button" className="topbar-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
                <IconLogout />
              </button>
            </div>
          </header>
          <HeroCarousel />
        </div>
        <main className="dashboard-content">
        <section className="dashboard-stats" aria-label="Indicadores de pacientes">
          <StatCard label="PACIENTES REGISTRADOS" value={cargando ? "—" : pacientes.length} detail="Expedientes en tu consulta" icon={<IconUsers />} tone="green" />
          <StatCard label="CATÁLOGO SUFICIENTE" value={cargando || !resumenCoberturaDisponible ? "—" : conCatalogoSuficiente} detail={resumenCoberturaDisponible ? "Según metas de alimentos" : "Sin datos todavía"} icon={<IconLeaf />} tone="violet" />
          <StatCard label="REQUIEREN ALIMENTOS" value={cargando || !resumenCoberturaDisponible ? "—" : conAlerta} detail={resumenCoberturaDisponible ? "Cobertura por completar" : "Sin datos todavía"} icon={<IconAlertTriangle />} tone="amber" />
        </section>

        <section id="listado-pacientes" className="patients-section" aria-label="Listado de pacientes">
          <div className="patients-heading">
            <div><span className="section-eyebrow">TU CONSULTA</span><h2>Pacientes</h2><p>Perfiles, planes alimentarios y seguimiento en un solo lugar.</p></div>
            <span className="patients-count">{conteo}</span>
          </div>
          <div className="patient-toolbar">
            <div className="patient-filters" role="group" aria-label="Filtrar pacientes">
              <button type="button" aria-pressed={filtro === "todos"} className={filtro === "todos" ? "active" : ""} onClick={() => setFiltro("todos")}>Todos <span>{pacientes.length}</span></button>
              <button type="button" aria-pressed={filtro === "alertas"} className={filtro === "alertas" ? "active" : ""} onClick={() => setFiltro("alertas")}><BrainCircuit size={15} strokeWidth={1.9} aria-hidden="true" />Menú en elaboración <span>{resumenMenusDisponible ? menusEnElaboracion : "—"}</span></button>
              <button type="button" aria-pressed={filtro === "suficientes"} className={filtro === "suficientes" ? "active" : ""} onClick={() => setFiltro("suficientes")}><UtensilsCrossed size={15} strokeWidth={1.9} aria-hidden="true" />Menú terminado <span>{resumenMenusDisponible ? menusTerminados : "—"}</span></button>
            </div>
            <label className="topbar-search patient-search" htmlFor="buscar-pacientes">
              <IconSearch style={{ width: 17, height: 17 }} />
              <input id="buscar-pacientes" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar paciente" />
            </label>
          </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 text-sm px-4 py-3 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">
            <IconAlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {cargando ? (
          <div className="patient-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 rounded-xl bg-white border border-line animate-pulse" />
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          <EmptyState onCreate={() => setModal({ tipo: "paciente", paciente: null })} onDemo={async () => {
            setError("");
            try { await crearPacienteDemo(); await cargarPacientes(); }
            catch (err) { setError(err.message); }
          }} />
        ) : pacientesFiltrados.length === 0 ? (
          <div className="filter-empty">No hay pacientes para esta búsqueda o filtro.</div>
        ) : (
          <div className="patient-grid">
            {pacientesFiltrados.map((p) => (
              <PacienteCard
                key={p.id}
                p={p}
                versionSeguimiento={versionCobertura}
                onMenu       ={() => setModal({ tipo: "menu",        paciente: p })}
                onSeguimiento={() => setModal({ tipo: "seguimiento", paciente: p })}
                onAcceso     ={() => setModal({ tipo: "acceso",      paciente: p })}
                onEditar     ={() => setModal({ tipo: "paciente",   paciente: p })}
                onEliminar   ={() => handleEliminar(p.id)}
              />
            ))}
            {!busqueda.trim() && filtro === "todos" && (
              <button type="button" className="patient-create-card" onClick={() => setModal({ tipo: "paciente", paciente: null })}>
                <span className="patient-create-icon"><IconPlus /></span>
                <strong>Registrar un nuevo paciente</strong>
                <span>Crea un expediente y comienza su plan nutricional.</span>
                <span className="patient-create-action">Iniciar expediente <span aria-hidden="true">→</span></span>
              </button>
            )}
          </div>
        )}
        </section>
        </main>
        <RecorridoGuiado pasos={PASOS_GUIA_NUTRICIONISTA} abierto={guiaManual || (!cargando && !guiaVista)} onCerrar={cerrarGuia} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.tipo !== null}
        onClose={cerrarModal}
        title={tituloModal}
        ancho={
          modal.tipo === "menu" ? "max-w-[980px]"
          : modal.tipo === "seguimiento" ? "max-w-3xl"
          : "max-w-3xl"
        }
      >
        {modal.tipo === "diseno" && (
          <PersonalizarDiseno nombreNutricionista={nutriologo ? `${nutriologo.nombre} ${nutriologo.apellido || ""}`.trim() : ""} onCerrar={cerrarModal} />
        )}
        {modal.tipo === "paciente" && (
          <FormularioPaciente
            pacienteEditar={modal.paciente}
            onSuccess={handleSuccessFormularioPaciente}
            onCancel={cerrarModal}
          />
        )}
        {modal.tipo === "menu" && modal.paciente && (
          <MenuPaciente
            idPaciente={modal.paciente.id}
            paciente={modal.paciente}
            presupuesto={modal.paciente.presupuesto}
            vistaInicial={modal.vistaInicial || "resumen"}
            onSeguimiento={() => setModal({ tipo: "seguimiento", paciente: modal.paciente })}
            onAcceso={() => setModal({ tipo: "acceso", paciente: modal.paciente })}
          />
        )}
        {modal.tipo === "seguimiento" && modal.paciente && (
          <SeguimientoPaciente idPaciente={modal.paciente.id} />
        )}
        {modal.tipo === "acceso" && modal.paciente && (
          <AccesoPaciente paciente={modal.paciente} />
        )}
      </Modal>
      <FloatingAssistant pacientes={pacientes} hidden={modal.tipo !== null}
        onAbrirMenu={(paciente, vistaInicial = "resumen") => setModal({ tipo: "menu", paciente, vistaInicial })} />
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ onCreate, onDemo }) {
  const [cargandoDemo, setCargandoDemo] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl text-center bg-white border border-line">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface text-nutri-brand mb-4">
        <IconUsers style={{ width: 24, height: 24 }} />
      </div>
      <h3 className="font-semibold text-lg">Todavía no hay pacientes</h3>
      <p className="text-sm text-muted mt-1 mb-6 max-w-xs">
        Agrega tu primer paciente para empezar a armar su plan nutricional.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 bg-nutri-ink hover:bg-nutri-ink-soft text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
      >
        <IconPlus />
        Agregar paciente
      </button>
      <button type="button" disabled={cargandoDemo} onClick={async () => {
        setCargandoDemo(true);
        try { await onDemo(); } finally { setCargandoDemo(false); }
      }} className="mt-3 text-sm font-semibold text-nutri-brand hover:underline disabled:opacity-60">
        {cargandoDemo ? "Cargando paciente de ejemplo…" : "Cargar paciente de ejemplo"}
      </button>
    </div>
  );
}

function StatCard({ label, value, detail, icon, tone = "green" }) {
  return (
    <div className={`dashboard-stat dashboard-stat-${tone}`}>
      <div><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>
      <span className="stat-icon">{icon}</span>
    </div>
  );
}

/* ── Patient card ─────────────────────────────────────────────────────────── */
function PacienteCard({ p, versionSeguimiento, onMenu, onSeguimiento, onAcceso, onEditar, onEliminar }) {
  const alergias = Array.isArray(p.alergias) ? p.alergias.filter(Boolean) : [];
  const enfermedades = Array.isArray(p.enfermedades) ? p.enfermedades.filter(Boolean) : [];

  return (
    <article className="patient-card bg-white rounded-xl border border-line flex flex-col" data-tour="paciente-tarjeta">
      <div className="p-6 flex-1">
        {/* Encabezado */}
        <div className="patient-card-header flex items-start gap-4">
          <div className="patient-avatar flex items-center justify-center w-11 h-11 rounded-full bg-surface text-nutri-ink font-semibold text-sm shrink-0">
            {iniciales(p.nombre)}
          </div>
          <div className="patient-card-identity flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">{p.nombre}</h3>
            <p className="patient-goal">{p.objetivo || "Objetivo sin registrar"}</p>
            {(p.edad || p.altura) && <p className="patient-profile-hint">{p.edad && <span><UserRound size={12} />{p.edad} años</span>}{p.altura && <span><Ruler size={12} />{p.altura} m</span>}</p>}
            {(alergias.length > 0 || enfermedades.length > 0) && <div className="patient-clinical-flags" aria-label="Alertas clínicas">
              {alergias.length > 0 && <span className="patient-clinical-tag patient-clinical-alert" title={alergias.join(", ")}><ShieldAlert size={13} /><span>{alergias.length === 1 ? "Alergia" : "Alergias"}: {alergias.slice(0, 2).join(", ")}{alergias.length > 2 ? ` +${alergias.length - 2}` : ""}</span></span>}
              {enfermedades.length > 0 && <span className="patient-clinical-tag patient-clinical-condition" title={enfermedades.join(", ")}><HeartPulse size={13} /><span>{enfermedades.slice(0, 2).join(", ")}{enfermedades.length > 2 ? ` +${enfermedades.length - 2}` : ""}</span></span>}
            </div>}
          </div>
          <div className="patient-card-hero-visual" aria-hidden="true" />
          <svg className="patient-card-medical-icon" viewBox="0 0 38 38" fill="none" aria-hidden="true" focusable="false">
            <path className="patient-card-medical-shield" d="M19 3 31 7v11c0 8-4.5 13.5-12 17-7.5-3.5-12-9-12-17V7L19 3Z" />
            <path d="M19 11v15M11.5 18.5h15" />
          </svg>
        </div>

        <MiniSeguimiento idPaciente={p.id} version={versionSeguimiento} pesoFicha={p.peso} nivelActividad={p.nivelActividad} objetivo={p.objetivo} />
      </div>

      {/* Acciones */}
      <div className="patient-actions">
        <button type="button" className="patient-plan-action" data-tour="paciente-menu" onClick={onMenu}>
          <span className="patient-plan-icon"><UtensilsCrossed size={18} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="patient-plan-copy"><strong>Menú semanal</strong><small>Plan nutricional personalizado</small></span>
          <span className="patient-plan-arrow" aria-hidden="true">→</span>
        </button>
        <details className="patient-more" data-tour="paciente-mas">
          <summary aria-label={`Más opciones para ${p.nombre}`} title="Más opciones"><Ellipsis size={19} aria-hidden="true" /></summary>
          <div className="patient-more-menu">
            <button type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; onSeguimiento(); }}><CalendarCheck2 size={15} aria-hidden="true" />Seguimiento de peso</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; onAcceso(); }}><Smartphone size={15} aria-hidden="true" />Acceso a la app</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; onEditar(); }}><IconPencil />Editar datos</button>
            <button type="button" className="patient-more-danger" onClick={(event) => { event.currentTarget.closest("details").open = false; onEliminar(); }}><IconTrash />Eliminar paciente</button>
          </div>
        </details>
      </div>
    </article>
  );
}

/* ── Metric ───────────────────────────────────────────────────────────────── */
export default Pacientes;

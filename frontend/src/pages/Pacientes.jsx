import { useState, useEffect } from "react";
import { listarPacientes, eliminarPaciente } from "../services/pacienteService";
import Modal from "../components/Modal";
import FormularioPaciente from "../components/FormularioPaciente";
import ListaAlimentos from "../components/ListaAlimentos";
import MenuPaciente from "../components/MenuPaciente";
import SeguimientoPaciente from "../components/SeguimientoPaciente";
import AsistenteChat from "../components/AsistenteChat";
import {
  IconUsers,
  IconPlus,
  IconFork,
  IconList,
  IconPencil,
  IconTrash,
  IconActivity,
  IconAlertTriangle,
  IconLeaf,
  IconCalendarCheck,
  IconSearch,
  IconMessageSquare,
} from "../components/Icons";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function sinRestricciones(texto = "") {
  return /^(ninguna?|no aplica|n\/a|-)$/i.test(texto.trim());
}

function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase() || "?";
}

function bmi(peso, altura) {
  if (!peso || !altura || altura === 0) return null;
  return (peso / (altura * altura)).toFixed(1);
}

function bmiLabel(val) {
  if (!val) return null;
  const v = parseFloat(val);
  if (v < 18.5) return { label: "Bajo peso", color: "#38BDF8" };
  if (v < 25)   return { label: "Normal",    color: "#10B981" };
  if (v < 30)   return { label: "Sobrepeso", color: "#F59E0B" };
  return              { label: "Obesidad",   color: "#F43F5E" };
}

function objColor(objetivo = "") {
  const o = objetivo.toLowerCase();
  if (o.includes("baj") || o.includes("perd")) return { bg: "rgba(14,207,199,0.1)", fg: "#0ECFC7" };
  if (o.includes("gan") || o.includes("mas")  || o.includes("músculo")) return { bg: "rgba(245,158,11,0.12)", fg: "#F59E0B" };
  return { bg: "rgba(129,140,248,0.12)", fg: "#818CF8" };
}

const AVATAR_GRADIENTS = [
  ["#0ECFC7","#0BA89F"],
  ["#818CF8","#6D5CE7"],
  ["#F59E0B","#D97706"],
  ["#10B981","#059669"],
  ["#F43F5E","#E11D48"],
  ["#38BDF8","#0EA5E9"],
];

function avatarGradient(id) {
  const [a, b] = AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

/* ── Main component ───────────────────────────────────────────────────────── */
function Pacientes() {
  const [pacientes, setPacientes]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState("");
  const [busqueda, setBusqueda]     = useState("");
  const [modal, setModal]           = useState({ tipo: null, paciente: null });

  useEffect(() => { cargarPacientes(); }, []);

  async function cargarPacientes() {
    setCargando(true);
    setError("");
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

  const cerrarModal  = ()  => setModal({ tipo: null, paciente: null });
  const handleSuccessFormularioPaciente = () => { cerrarModal(); cargarPacientes(); };

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  const tituloModal =
    modal.tipo === "paciente"
      ? modal.paciente ? "Editar paciente" : "Nuevo paciente"
      : modal.tipo === "alimentos"
        ? `Alimentos — ${modal.paciente?.nombre}`
        : modal.tipo === "menu"
          ? `Menú — ${modal.paciente?.nombre}`
          : modal.tipo === "seguimiento"
            ? `Seguimiento — ${modal.paciente?.nombre}`
            : modal.tipo === "asistente"
              ? `Asistente — ${modal.paciente?.nombre}`
              : "";

  if (cargando) {
    return (
      <div className="px-8 py-8">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className="rounded-2xl bg-white"
              style={{
                height: 200,
                border: "1px solid #E8EEF5",
                background: "linear-gradient(90deg, #F0F4F8 25%, #E8EEF5 50%, #F0F4F8 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 min-h-screen" style={{ background: "#F0F4F8" }}>
      {/* Header */}
      <PageHeader />

      {/* Search + CTA row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-7 mb-7">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "#94A3B8", width: 16, height: 16 }}
          />
          <input
            id="buscar-pacientes"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente…"
            className="w-full text-sm outline-none transition-all duration-200"
            style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "10px 14px 10px 38px",
              color: "#0D1829",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(14,207,199,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(14,207,199,0.1)"; }}
            onBlur={e  => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
          />
        </div>

        <button
          onClick={() => setModal({ tipo: "paciente", paciente: null })}
          className="btn-glow flex items-center gap-2 font-display font-semibold text-sm text-white px-5 py-2.5 shrink-0"
          style={{
            background: "linear-gradient(135deg, #0ECFC7 0%, #0BA89F 100%)",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.1px",
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
          }}
        >
          <IconPlus />
          Nuevo paciente
        </button>
      </div>

      {/* Stats pill */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full text-sm font-medium"
        style={{
          background: "rgba(14,207,199,0.08)",
          border: "1px solid rgba(14,207,199,0.15)",
          color: "#0BA89F",
        }}
      >
        <IconUsers style={{ width: 15, height: 15 }} />
        <span>
          {busqueda.trim() ? `${pacientesFiltrados.length} resultado${pacientesFiltrados.length !== 1 ? "s" : ""}` : `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""} registrado${pacientes.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {error && (
        <div
          className="mb-5 flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl animate-fade-in"
          style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E" }}
        >
          <IconAlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Grid */}
      {pacientes.length === 0 ? (
        <EmptyState onCreate={() => setModal({ tipo: "paciente", paciente: null })} />
      ) : pacientesFiltrados.length === 0 ? (
        <p className="text-slate-500 text-sm mt-4">Ningún paciente coincide con "{busqueda}".</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 card-grid">
          {pacientesFiltrados.map((p) => (
            <PacienteCard
              key={p.id}
              p={p}
              onAlimentos={() => setModal({ tipo: "alimentos",   paciente: p })}
              onMenu       ={() => setModal({ tipo: "menu",        paciente: p })}
              onSeguimiento={() => setModal({ tipo: "seguimiento", paciente: p })}
              onAsistente  ={() => setModal({ tipo: "asistente",   paciente: p })}
              onEditar     ={() => setModal({ tipo: "paciente",   paciente: p })}
              onEliminar   ={() => handleEliminar(p.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.tipo !== null}
        onClose={cerrarModal}
        title={tituloModal}
        ancho={
          modal.tipo === "menu" || modal.tipo === "alimentos" ? "max-w-5xl"
          : modal.tipo === "seguimiento" ? "max-w-2xl"
          : modal.tipo === "asistente"   ? "max-w-xl"
          : "max-w-lg"
        }
      >
        {modal.tipo === "paciente" && (
          <FormularioPaciente
            pacienteEditar={modal.paciente}
            onSuccess={handleSuccessFormularioPaciente}
            onCancel={cerrarModal}
          />
        )}
        {modal.tipo === "alimentos" && modal.paciente && (
          <ListaAlimentos idPaciente={modal.paciente.id} paciente={modal.paciente} />
        )}
        {modal.tipo === "menu" && modal.paciente && (
          <MenuPaciente idPaciente={modal.paciente.id} presupuesto={modal.paciente.presupuesto} />
        )}
        {modal.tipo === "seguimiento" && modal.paciente && (
          <SeguimientoPaciente idPaciente={modal.paciente.id} />
        )}
        {modal.tipo === "asistente" && modal.paciente && (
          <AsistenteChat paciente={modal.paciente} />
        )}
      </Modal>
    </div>
  );
}

/* ── Page header ──────────────────────────────────────────────────────────── */
function PageHeader() {
  return (
    <div className="animate-fade-in-up">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1"
        style={{ color: "#0ECFC7" }}
      >
        Panel principal
      </p>
      <h1
        className="font-display font-bold"
        style={{ fontSize: 30, color: "#0D1829", letterSpacing: "-0.6px", textWrap: "balance" }}
      >
        Mis Pacientes
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: "#64748B", maxWidth: 480 }}>
        Gestiona perfiles, planes alimentarios y el progreso de cada paciente desde aquí.
      </p>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ onCreate }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-2xl text-center animate-fade-in"
      style={{ border: "2px dashed rgba(14,207,199,0.2)", background: "rgba(14,207,199,0.03)" }}
    >
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: 64, height: 64,
          borderRadius: 18,
          background: "rgba(14,207,199,0.1)",
          color: "#0ECFC7",
        }}
      >
        <IconUsers style={{ width: 28, height: 28 }} />
      </div>
      <h3 className="font-display font-bold text-lg" style={{ color: "#0D1829" }}>
        Sin pacientes aún
      </h3>
      <p className="text-sm mt-1 mb-5" style={{ color: "#94A3B8", maxWidth: 280 }}>
        Agrega tu primer paciente para comenzar a gestionar sus planes nutricionales.
      </p>
      <button
        onClick={onCreate}
        className="btn-glow flex items-center gap-2 font-display font-semibold text-sm text-white px-5 py-2.5"
        style={{
          background: "linear-gradient(135deg, #0ECFC7 0%, #0BA89F 100%)",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        <IconPlus />
        Agregar primer paciente
      </button>
    </div>
  );
}

/* ── Patient card ─────────────────────────────────────────────────────────── */
function PacienteCard({ p, onAlimentos, onMenu, onSeguimiento, onAsistente, onEditar, onEliminar }) {
  const imc     = bmi(p.peso, p.altura);
  const imcInfo = bmiLabel(imc);
  const obj     = objColor(p.objetivo);
  const tienRestr = p.restricciones && !sinRestricciones(p.restricciones);

  return (
    <article
      className="patient-card bg-white rounded-2xl p-5"
      style={{ border: "1px solid #E8EEF5", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Top row: avatar + info + badges */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="flex items-center justify-center font-display font-bold text-white flex-shrink-0 relative"
          style={{
            width: 52, height: 52,
            borderRadius: 15,
            background: avatarGradient(p.id),
            fontSize: 18,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {iniciales(p.nombre)}
          {/* Status dot */}
          <span
            style={{
              position: "absolute",
              right: -3, bottom: -3,
              width: 12, height: 12,
              borderRadius: "50%",
              background: "#10B981",
              border: "2px solid #fff",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-display font-bold truncate"
            style={{ fontSize: 16, color: "#0D1829", letterSpacing: "-0.3px" }}
          >
            {p.nombre}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              className="inline-flex items-center font-semibold"
              style={{
                fontSize: 11,
                padding: "2px 9px",
                borderRadius: 20,
                background: obj.bg,
                color: obj.fg,
                letterSpacing: "0.03em",
              }}
            >
              {p.objetivo}
            </span>
            {imcInfo && (
              <span
                className="inline-flex items-center font-semibold"
                style={{
                  fontSize: 11,
                  padding: "2px 9px",
                  borderRadius: 20,
                  background: `${imcInfo.color}18`,
                  color: imcInfo.color,
                  letterSpacing: "0.03em",
                }}
              >
                IMC {imc} · {imcInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Meals badge */}
        <div
          className="flex flex-col items-center justify-center text-center shrink-0"
          style={{
            background: "#F8FAFC",
            border: "1px solid #E8EEF5",
            borderRadius: 12,
            padding: "8px 12px",
            minWidth: 52,
          }}
        >
          <span
            className="tabular font-display font-bold leading-none"
            style={{ fontSize: 22, color: "#0D1829" }}
          >
            {p.numeroComidas}
          </span>
          <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>
            Comidas
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <Metric label="Peso"    value={p.peso}   unit="kg" />
        <Metric label="Altura"  value={p.altura ? `${p.altura}m` : "—"} />
        <Metric label="Actividad" value={p.nivelActividad} small />
      </div>

      {/* Tags: restricciones + preferencias */}
      {(tienRestr || p.preferencias) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tienRestr && (
            <div
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", color: "#B45309" }}
            >
              <IconAlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span className="font-medium truncate max-w-[160px]">{p.restricciones}</span>
            </div>
          )}
          {p.preferencias && (
            <div
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", color: "#047857" }}
            >
              <IconLeaf style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span className="font-medium truncate max-w-[160px]">{p.preferencias}</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div
        className="grid grid-cols-6 gap-1 pt-3.5"
        style={{ borderTop: "1px solid #F0F4F8" }}
      >
        <ActionBtn onClick={onAlimentos}   icon={<IconFork />}          label="Alimentos"   />
        <ActionBtn onClick={onMenu}        icon={<IconList />}          label="Menú"        />
        <ActionBtn onClick={onSeguimiento} icon={<IconCalendarCheck />} label="Seguimiento" />
        <ActionBtn onClick={onAsistente}   icon={<IconMessageSquare />} label="Asistente"   accent />
        <ActionBtn onClick={onEditar}      icon={<IconPencil />}        label="Editar"      />
        <ActionBtn onClick={onEliminar}    icon={<IconTrash />}         label="Eliminar"    danger />
      </div>
    </article>
  );
}

/* ── Metric chip ──────────────────────────────────────────────────────────── */
function Metric({ label, value, unit, small }) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: "#F8FAFC",
        border: "1px solid #E8EEF5",
        borderRadius: 10,
        padding: "9px 10px",
      }}
    >
      <span
        className="tabular font-display font-bold leading-none truncate"
        style={{ fontSize: small ? 12 : 16, color: "#0D1829" }}
      >
        {value}{unit && <span style={{ fontSize: 10, fontWeight: 500, color: "#94A3B8", marginLeft: 1 }}>{unit}</span>}
      </span>
      <span
        className="mt-1 uppercase tracking-wider"
        style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Action button ────────────────────────────────────────────────────────── */
function ActionBtn({ onClick, icon, label, accent, danger }) {
  const base = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "8px 4px",
    border: "none",
    background: "none",
    cursor: "pointer",
    borderRadius: 10,
    transition: "all 0.15s ease",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  function getStyle(hovered) {
    if (danger) return {
      ...base,
      color: hovered ? "#F43F5E" : "#94A3B8",
      background: hovered ? "rgba(244,63,94,0.06)" : "none",
    };
    if (accent) return {
      ...base,
      color: hovered ? "#0ECFC7" : "#94A3B8",
      background: hovered ? "rgba(14,207,199,0.08)" : "none",
    };
    return {
      ...base,
      color: hovered ? "#0D1829" : "#94A3B8",
      background: hovered ? "rgba(13,24,41,0.04)" : "none",
    };
  }

  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={getStyle(hovered)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ display: "flex", width: 18, height: 18 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
    </button>
  );
}

export default Pacientes;

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
  if (v < 18.5) return { label: "Bajo peso", color: "var(--color-nutri-blue)" };
  if (v < 25)   return { label: "Normal",    color: "var(--color-nutri-green)" };
  if (v < 30)   return { label: "Sobrepeso", color: "var(--color-nutri-orange)" };
  return              { label: "Obesidad",   color: "var(--color-nutri-pink)" };
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

  const conteo = busqueda.trim()
    ? `${pacientesFiltrados.length} resultado${pacientesFiltrados.length !== 1 ? "s" : ""}`
    : `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-surface">
      {/* Franja superior */}
      <header className="bg-nutri-ink text-white">
        <div className="px-10 pt-12 pb-10">
          <h1 className="text-4xl font-semibold" style={{ letterSpacing: "-0.02em" }}>
            Pacientes
          </h1>
          <p className="mt-3 text-base text-white/70 max-w-xl leading-relaxed">
            Perfiles, planes alimentarios y seguimiento de cada paciente.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8">
            <div className="relative w-full sm:max-w-md">
              <IconSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                style={{ width: 16, height: 16 }}
              />
              <input
                id="buscar-pacientes"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre"
                className="w-full bg-white text-nutri-ink placeholder-gray-500 text-sm rounded-full pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-nutri-mint"
              />
            </div>
            <button
              onClick={() => setModal({ tipo: "paciente", paciente: null })}
              className="flex items-center justify-center gap-2 bg-nutri-mint text-nutri-ink hover:bg-white font-semibold text-sm px-6 py-3 rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <IconPlus />
              Nuevo paciente
            </button>
          </div>
        </div>
      </header>

      <main className="px-10 py-8">
        {!cargando && pacientes.length > 0 && (
          <p className="text-sm text-muted mb-4">{conteo}</p>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2.5 text-sm px-4 py-3 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">
            <IconAlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {cargando ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 rounded-xl bg-white border border-line animate-pulse" />
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          <EmptyState onCreate={() => setModal({ tipo: "paciente", paciente: null })} />
        ) : pacientesFiltrados.length === 0 ? (
          <p className="text-muted text-sm mt-4">Ningún paciente coincide con "{busqueda}".</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </main>

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

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ onCreate }) {
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
    </div>
  );
}

/* ── Patient card ─────────────────────────────────────────────────────────── */
function PacienteCard({ p, onAlimentos, onMenu, onSeguimiento, onAsistente, onEditar, onEliminar }) {
  const imc     = bmi(p.peso, p.altura);
  const imcInfo = bmiLabel(imc);
  const tienRestr = p.restricciones && !sinRestricciones(p.restricciones);

  return (
    <article className="patient-card bg-white rounded-xl border border-line flex flex-col">
      <div className="p-6 flex-1">
        {/* Encabezado */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-surface text-nutri-ink font-semibold text-sm shrink-0">
            {iniciales(p.nombre)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">{p.nombre}</h3>
            <p className="text-sm text-muted mt-0.5">
              {p.objetivo}
              {p.numeroComidas ? (
                <>
                  <Separador />
                  {p.numeroComidas} comidas al día
                </>
              ) : null}
            </p>
          </div>
          {imcInfo && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-surface rounded-full px-3 py-1 shrink-0">
              <span className="w-2 h-2 rounded-full" style={{ background: imcInfo.color }} />
              <span>
                IMC {imc}
                <Separador />
                {imcInfo.label}
              </span>
            </span>
          )}
        </div>

        {/* Métricas */}
        <dl className="grid grid-cols-3 mt-6 border-y border-line divide-x divide-line">
          <Metric label="Peso" value={p.peso ? `${p.peso} kg` : "—"} />
          <Metric label="Altura" value={p.altura ? `${p.altura} m` : "—"} />
          <Metric label="Actividad" value={p.nivelActividad || "—"} />
        </dl>

        {/* Restricciones y preferencias */}
        {(tienRestr || p.preferencias) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tienRestr && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-nutri-orange/10 text-nutri-orange">
                <IconAlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span className="truncate max-w-[180px]">{p.restricciones}</span>
              </span>
            )}
            {p.preferencias && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-nutri-brand/10 text-nutri-brand">
                <IconLeaf style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span className="truncate max-w-[180px]">{p.preferencias}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 border-t border-line">
        <ActionBtn onClick={onMenu}        icon={<IconList />}          label="Menú" />
        <ActionBtn onClick={onAlimentos}   icon={<IconFork />}          label="Alimentos" />
        <ActionBtn onClick={onSeguimiento} icon={<IconCalendarCheck />} label="Seguimiento" />
        <ActionBtn onClick={onAsistente}   icon={<IconMessageSquare />} label="Asistente" />
        <div className="flex-1" />
        <IconBtn onClick={onEditar}   icon={<IconPencil />} label="Editar" />
        <IconBtn onClick={onEliminar} icon={<IconTrash />}  label="Eliminar" danger />
      </div>
    </article>
  );
}

/* ── Separador "·" con espacio visible (Overpass dibuja los espacios muy angostos) */
function Separador() {
  return <span className="mx-1.5 text-gray-400" aria-hidden="true">·</span>;
}

/* ── Metric ───────────────────────────────────────────────────────────────── */
function Metric({ label, value }) {
  return (
    <div className="py-3 px-4 first:pl-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular font-semibold mt-0.5 truncate">{value}</dd>
    </div>
  );
}

/* ── Action buttons ───────────────────────────────────────────────────────── */
function ActionBtn({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-gray-600 hover:text-nutri-ink hover:bg-surface transition-colors cursor-pointer"
    >
      <span className="flex w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      {label}
    </button>
  );
}

function IconBtn({ onClick, icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center w-8 h-8 rounded-md text-gray-500 transition-colors cursor-pointer ${
        danger ? "hover:text-nutri-pink hover:bg-nutri-pink/5" : "hover:text-nutri-ink hover:bg-surface"
      }`}
    >
      <span className="flex w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
    </button>
  );
}

export default Pacientes;

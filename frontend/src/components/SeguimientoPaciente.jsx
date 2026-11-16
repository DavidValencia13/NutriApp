import { useState, useEffect } from "react";
import {
  listarSeguimiento,
  registrarSeguimiento,
  eliminarSeguimiento,
} from "../services/seguimientoService";
import { IconTrash } from "./Icons";
import CumplimientoMenu from "./CumplimientoMenu";
import DiarioAlimentario from "./DiarioAlimentario";
import PesoTrendChart from "./PesoTrendChart";
import { ordenarControles } from "../utils/ordenarControles";
import { AlertTriangle, CalendarDays, ClipboardCheck, NotebookPen, Scale } from "lucide-react";

const ESTILOS_NIVEL = {
  bien: { label: "Buena", clase: "bg-nutri-green/15 text-nutri-green" },
  regular: { label: "Parcial", clase: "bg-nutri-orange/15 text-nutri-orange" },
  mal: { label: "Baja", clase: "bg-nutri-pink/15 text-nutri-pink" },
};

function hoyISO() {
  const hoy = new Date();
  return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatoPeso(valor) {
  return Number(valor).toFixed(1).replace(".", ",");
}

function controlesDudososMismoDia(pesos) {
  const porDia = new Map();
  for (const registro of pesos) {
    const dia = new Date(registro.fecha).toISOString().slice(0, 10);
    porDia.set(dia, [...(porDia.get(dia) || []), Number(registro.peso)]);
  }
  for (const [dia, valores] of porDia) {
    if (valores.length < 2) continue;
    const menor = Math.min(...valores);
    const mayor = Math.max(...valores);
    if (mayor >= menor * 1.5) return { dia, menor, mayor };
  }
  return null;
}

// Bitácora simple del paciente: por fecha, registra peso y si la dieta se
// está cumpliendo bien/regular/mal, más una observación libre. A diferencia
// de Historial/Consulta (mediciones del consultorio) o del Menú (planeación
// de comidas), esto es solo lo mínimo que el nutriólogo quiere ir anotando
// entre consultas.
function SeguimientoPaciente({ idPaciente }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    let vigente = true;
    listarSeguimiento(idPaciente)
      .then((data) => { if (vigente) setRegistros(data); })
      .catch((err) => { if (vigente) setError(err.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [idPaciente]);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const data = await listarSeguimiento(idPaciente);
      setRegistros(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      await eliminarSeguimiento(idPaciente, id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSuccessFormulario() {
    setMostrarFormulario(false);
    cargar();
  }

  if (cargando) return <p>Cargando seguimiento...</p>;

  const pesos = registros
    .filter((r) => Number.isFinite(Number(r.peso)) && Number(r.peso) > 0)
    .sort(ordenarControles);
  const diasConPeso = new Set(pesos.map((r) => new Date(r.fecha).toISOString().slice(0, 10))).size;
  const primero = pesos[0];
  const ultimo = pesos.at(-1);
  const cambio = pesos.length >= 2 ? Number(ultimo.peso) - Number(primero.peso) : null;
  const formatoFecha = (valor) => new Date(valor).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const controlDudoso = controlesDudososMismoDia(pesos);

  return (
    <div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}

      <section className="followup-overview" aria-label="Resumen de controles de peso">
        <div className="followup-overview-heading"><div><span>CONTROLES CLÍNICOS</span><h3>Evolución del peso corporal</h3></div><small>{pesos.length} {pesos.length === 1 ? "control con peso" : "controles con peso"}</small></div>
        {controlDudoso && <div className="followup-data-warning" role="alert"><AlertTriangle size={17} aria-hidden="true" /><p><strong>Revisa los pesos del {formatoFecha(controlDudoso.dia)}.</strong> Se guardaron {formatoPeso(controlDudoso.menor)} y {formatoPeso(controlDudoso.mayor)} kg el mismo día. La gráfica muestra el último; ambos siguen en el historial. Si uno fue un error, elimínalo en «Controles registrados».</p></div>}
        {ultimo ? <>
          <div className="followup-overview-stats">
            <div><span>Primer control</span><strong>{formatoPeso(primero.peso)} kg</strong><small>{formatoFecha(primero.fecha)}</small></div>
            <div><span>Último control</span><strong>{formatoPeso(ultimo.peso)} kg</strong><small>{formatoFecha(ultimo.fecha)}</small></div>
            <div><span>Cambio entre controles</span><strong>{cambio === null ? "Por calcular" : Math.abs(cambio) < 0.05 ? "Sin variación" : `${cambio < 0 ? "Bajó" : "Subió"} ${formatoPeso(Math.abs(cambio))} kg`}</strong><small>{cambio === null ? "Se necesitan dos controles" : "Comparado con el primer control"}</small></div>
          </div>
          {diasConPeso >= 2 && <><p className="followup-chart-context"><Scale size={14} aria-hidden="true" />Peso medido (kg) · último control de cada fecha</p><PesoTrendChart registros={pesos} id={`detalle-${idPaciente}`} /></>}
          {pesos.length >= 2 && diasConPeso < 2 && <p className="followup-overview-empty">Hay varios controles en la misma fecha. Registra un peso en otra fecha para ver la tendencia.</p>}
        </> : <p className="followup-overview-empty">Todavía no hay controles con peso. Registra uno para iniciar el seguimiento.</p>}
        <p className="followup-overview-note">La línea muestra únicamente peso. La alimentación registrada por el paciente aparece más abajo y no modifica esta gráfica.</p>
      </section>

      <div className="followup-entry-section">
        <button
          onClick={() => setMostrarFormulario((v) => !v)}
          className="followup-open-button"
        >
          <Scale size={15} aria-hidden="true" />{mostrarFormulario ? "Cerrar formulario de peso" : "Registrar nuevo peso"}
        </button>
        {mostrarFormulario && (
          <FormularioSeguimiento
            idPaciente={idPaciente}
            ultimoPeso={ultimo?.peso}
            onSuccess={handleSuccessFormulario}
            onCancel={() => setMostrarFormulario(false)}
          />
        )}
      </div>

      <div className="followup-records">
        <p className="font-semibold text-nutri-ink mb-2 text-sm">
          Controles registrados ({registros.length})
        </p>
        {registros.length === 0 ? (
          <p className="text-gray-500 text-xs">Todavía no hay registros de seguimiento.</p>
        ) : (
          <div className="grid gap-1.5">
            {[...registros].sort(ordenarControles).reverse().map((r) => {
              const estilo = ESTILOS_NIVEL[r.nivelCumplimiento] || ESTILOS_NIVEL.regular;
              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-nutri-ink flex items-center gap-2 flex-wrap">
                      {formatoFecha(r.fecha)}
                      {r.peso != null && <span>· Peso: {formatoPeso(r.peso)} kg</span>}
                      <span className={`px-2 py-0.5 rounded-full font-medium ${estilo.clase}`}>
                        Adherencia: {estilo.label}
                      </span>
                    </p>
                    {r.observaciones && (
                      <p className="text-gray-500 mt-0.5">Obs: {r.observaciones}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminar(r.id)}
                    className="text-nutri-pink hover:opacity-70 shrink-0"
                    aria-label={`Eliminar control del ${formatoFecha(r.fecha)}${r.peso != null ? ` de ${formatoPeso(r.peso)} kg` : ""}`}
                  >
                    <IconTrash width="14" height="14" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="followup-food-section"><DiarioAlimentario idPaciente={idPaciente} /></div>
      <CumplimientoMenu idPaciente={idPaciente} />
    </div>
  );
}

function FormularioSeguimiento({ idPaciente, ultimoPeso, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    fecha: hoyISO(),
    peso: "",
    nivelCumplimiento: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [pesoConfirmado, setPesoConfirmado] = useState(false);
  const pesoIngresado = form.peso === "" ? null : Number(form.peso);
  const pesoAnterior = Number(ultimoPeso);
  const diferencia = pesoIngresado > 0 && pesoAnterior > 0 ? pesoIngresado - pesoAnterior : null;
  const cambioInusual = diferencia !== null && Math.abs(diferencia) >= pesoAnterior * 0.25;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "peso") setPesoConfirmado(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (cambioInusual && !pesoConfirmado) {
      setError("Confirma que ingresaste el peso total medido, no solo los kilos que cambiaron.");
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        // El formulario captura un día, no una hora. El final del día UTC
        // conserva esa fecha y sitúa el nuevo control tras los previos del día.
        fecha: new Date(`${form.fecha}T23:59:59.000Z`),
        peso: pesoIngresado,
        nivelCumplimiento: form.nivelCumplimiento,
        observaciones: form.observaciones || undefined,
      };
      await registrarSeguimiento(idPaciente, datos);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm";
  const labelClass = "block mb-1 text-xs font-medium text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="followup-entry-form mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="followup-form-heading"><Scale size={19} aria-hidden="true" /><div><strong>Nuevo control de peso</strong><p>Registra el peso total y valora la adherencia. Los alimentos se anotan por separado en la app del paciente.</p></div></div>
      {error && <p className="bg-red-100 text-red-700 text-xs p-2 rounded mb-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <div>
          <label htmlFor={`followup-date-${idPaciente}`} className={labelClass}><CalendarDays size={13} aria-hidden="true" />Fecha del control *</label>
          <input id={`followup-date-${idPaciente}`} type="date" name="fecha" value={form.fecha} max={hoyISO()} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`followup-weight-${idPaciente}`} className={labelClass}><Scale size={13} aria-hidden="true" />Peso total medido (kg) *</label>
          <input id={`followup-weight-${idPaciente}`} type="number" step="any" min="0.1" inputMode="decimal" placeholder="Ej. 68.5" name="peso" value={form.peso} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`followup-adherence-${idPaciente}`} className={labelClass}><ClipboardCheck size={13} aria-hidden="true" />Adherencia valorada *</label>
          <select id={`followup-adherence-${idPaciente}`} name="nivelCumplimiento" value={form.nivelCumplimiento} onChange={handleChange} required className={inputClass}>
            <option value="" disabled>Selecciona</option>
            <option value="bien">Buena</option>
            <option value="regular">Parcial</option>
            <option value="mal">Baja</option>
          </select>
        </div>
      </div>

      <div className="followup-weight-help" aria-live="polite">
        <span>{pesoAnterior > 0 ? `Último peso: ${formatoPeso(pesoAnterior)} kg.` : ""} Escribe el valor completo de la báscula, no cuánto cambió.</span>
        {diferencia !== null && <strong className={cambioInusual ? "followup-weight-change-warning" : ""}>Cambio frente al último control: {diferencia > 0 ? "+" : ""}{formatoPeso(diferencia)} kg</strong>}
      </div>
      {cambioInusual && <label className="followup-weight-confirm"><input type="checkbox" checked={pesoConfirmado} onChange={(event) => setPesoConfirmado(event.target.checked)} />Confirmo que {formatoPeso(pesoIngresado)} kg es el peso total medido.</label>}

      <div className="mb-3">
        <label htmlFor={`followup-notes-${idPaciente}`} className={labelClass}><NotebookPen size={13} aria-hidden="true" />Observaciones (opcional)</label>
        <textarea id={`followup-notes-${idPaciente}`} name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded border border-gray-300 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="px-3 py-1.5 rounded bg-nutri-brand text-white text-sm disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar control de peso"}
        </button>
      </div>
    </form>
  );
}

export default SeguimientoPaciente;

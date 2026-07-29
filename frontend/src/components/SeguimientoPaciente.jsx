import { useState, useEffect } from "react";
import {
  listarSeguimiento,
  registrarSeguimiento,
  eliminarSeguimiento,
} from "../services/seguimientoService";
import { IconTrash } from "./Icons";

const ESTILOS_NIVEL = {
  bien: { label: "Bien", clase: "bg-nutri-green/15 text-nutri-green" },
  regular: { label: "Regular", clase: "bg-nutri-orange/15 text-nutri-orange" },
  mal: { label: "Mal", clase: "bg-nutri-pink/15 text-nutri-pink" },
};

// Convierte el nivel cualitativo en un puntaje para poder graficarlo como
// línea (mismo criterio que usa el backend en Seguimiento/ResumenSeguimiento
// para calcular el % de apego a la dieta).
const PUNTOS_NIVEL = { bien: 100, regular: 60, mal: 20 };

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
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
    cargar();
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

  const valoresPeso = registros
    .filter((r) => r.peso !== undefined)
    .map((r) => ({ fecha: r.fecha, valor: r.peso }));
  const valoresCumplimiento = registros.map((r) => ({
    fecha: r.fecha,
    valor: PUNTOS_NIVEL[r.nivelCumplimiento],
  }));

  return (
    <div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}

      {registros.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <GraficaLineas
            titulo="Peso"
            unidad="kg"
            color="#1ba9a0"
            valores={valoresPeso}
            mensajeVacio="Todavía no hay registros con peso."
          />
          <GraficaLineas
            titulo="Cumplimiento"
            unidad="%"
            color="#2e86c1"
            valores={valoresCumplimiento}
          />
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => setMostrarFormulario((v) => !v)}
          className="text-sm text-nutri-teal hover:underline"
        >
          {mostrarFormulario ? "− Cancelar" : "+ Registrar seguimiento"}
        </button>
        {mostrarFormulario && (
          <FormularioSeguimiento
            idPaciente={idPaciente}
            onSuccess={handleSuccessFormulario}
            onCancel={() => setMostrarFormulario(false)}
          />
        )}
      </div>

      <div>
        <p className="font-semibold text-nutri-navy mb-2 text-sm">
          Registros ({registros.length})
        </p>
        {registros.length === 0 ? (
          <p className="text-gray-500 text-xs">Todavía no hay registros de seguimiento.</p>
        ) : (
          <div className="grid gap-1.5">
            {[...registros].reverse().map((r) => {
              const estilo = ESTILOS_NIVEL[r.nivelCumplimiento] || ESTILOS_NIVEL.regular;
              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-nutri-navy flex items-center gap-2 flex-wrap">
                      {new Date(r.fecha).toLocaleDateString()}
                      {r.peso !== undefined && <span>· {r.peso} kg</span>}
                      <span className={`px-2 py-0.5 rounded-full font-medium ${estilo.clase}`}>
                        {estilo.label}
                      </span>
                    </p>
                    {r.observaciones && (
                      <p className="text-gray-500 mt-0.5">Obs: {r.observaciones}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminar(r.id)}
                    className="text-nutri-pink hover:opacity-70 shrink-0"
                    aria-label="Eliminar registro"
                  >
                    <IconTrash width="14" height="14" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FormularioSeguimiento({ idPaciente, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    fecha: hoyISO(),
    peso: "",
    nivelCumplimiento: "bien",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const datos = {
        fecha: form.fecha ? new Date(form.fecha) : undefined,
        peso: form.peso === "" ? undefined : parseFloat(form.peso),
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
    <form onSubmit={handleSubmit} className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
      {error && <p className="bg-red-100 text-red-700 text-xs p-2 rounded mb-2">{error}</p>}

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className={labelClass}>Fecha *</label>
          <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Peso (kg)</label>
          <input type="number" step="any" min="0" name="peso" value={form.peso} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cumplimiento *</label>
          <select name="nivelCumplimiento" value={form.nivelCumplimiento} onChange={handleChange} className={inputClass}>
            <option value="bien">Bien</option>
            <option value="regular">Regular</option>
            <option value="mal">Mal</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass}>Observaciones</label>
        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded border border-gray-300 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="px-3 py-1.5 rounded bg-nutri-teal text-white text-sm disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// Gráfico de líneas simple (un solo trazo) — versión reducida del patrón ya
// usado antes en el historial del paciente, sin small multiples ni
// comparación de periodos: aquí solo importa ver la tendencia de un vistazo.
function GraficaLineas({ titulo, unidad, color, valores, mensajeVacio }) {
  const [hover, setHover] = useState(null);

  if (valores.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-nutri-navy mb-1">{titulo}</p>
        <p className="text-xs text-gray-400">{mensajeVacio || "Todavía no hay datos suficientes."}</p>
      </div>
    );
  }

  const w = 280;
  const h = 110;
  const padX = 10;
  const padY = 20;
  const min = Math.min(...valores.map((v) => v.valor));
  const max = Math.max(...valores.map((v) => v.valor));
  const rango = max - min || 1;

  const x = (i) => padX + (i * (w - padX * 2)) / Math.max(valores.length - 1, 1);
  const y = (v) => h - padY - ((v - min) / rango) * (h - padY * 2);
  const puntosPath = valores.map((v, i) => `${x(i)},${y(v.valor)}`).join(" ");

  const primero = valores[0];
  const ultimo = valores[valores.length - 1];
  const delta = valores.length > 1 ? ultimo.valor - primero.valor : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-xs font-semibold text-nutri-navy">{titulo}</p>
        {delta !== undefined && (
          <span className={`text-[11px] font-medium ${Math.abs(delta) < 0.05 ? "text-gray-400" : "text-nutri-navy"}`}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} {unidad}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Evolución de ${titulo}: ${valores.map((v) => v.valor.toFixed(1)).join(", ")}`}
      >
        <line x1={padX} y1={y(min)} x2={w - padX} y2={y(min)} stroke="#e5e7eb" strokeWidth="1" />
        {max !== min && (
          <line x1={padX} y1={y(max)} x2={w - padX} y2={y(max)} stroke="#e5e7eb" strokeWidth="1" />
        )}
        {valores.length > 1 && (
          <polyline
            points={puntosPath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {valores.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v.valor)}
            r={hover === i ? 5 : 3.5}
            fill={color}
            stroke="#fff"
            strokeWidth="1.5"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
        <text
          x={x(valores.length - 1)}
          y={Math.max(y(ultimo.valor) - 8, 10)}
          textAnchor="end"
          fontSize="10"
          fill={color}
          fontWeight="600"
        >
          {ultimo.valor.toFixed(1)}
          {unidad}
        </text>
      </svg>
      <p className="text-[10px] text-gray-400 text-center h-3">
        {hover !== null &&
          `${new Date(valores[hover].fecha).toLocaleDateString()}: ${valores[hover].valor.toFixed(1)} ${unidad}`}
      </p>
    </div>
  );
}

export default SeguimientoPaciente;

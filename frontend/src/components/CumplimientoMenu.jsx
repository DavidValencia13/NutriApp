import { useState, useEffect } from "react";
import {
  registrarCumplimiento,
  listarCumplimiento,
  obtenerResumenCumplimiento,
  eliminarCumplimiento,
} from "../services/cumplimientoService";

const inputClass = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm";
const labelClass = "block mb-1 text-xs font-medium text-gray-600";

// Seguimiento del cumplimiento del paciente: el nutriólogo registra, día por
// día del menú, qué comidas se consumieron/omitieron y otros datos de
// adherencia (agua, peso, hambre, energía, actividad física, síntomas). No
// es self-service del paciente (no tiene cuenta propia hoy) — es un
// formulario que llena el nutriólogo en consulta (RF punto 8).
function CumplimientoMenu({ idPaciente, idMenu, dias }) {
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [registrosData, resumenData] = await Promise.all([
        listarCumplimiento(idPaciente, idMenu),
        obtenerResumenCumplimiento(idPaciente, idMenu),
      ]);
      setRegistros(registrosData);
      setResumen(resumenData);
    } catch {
      // Silencioso a propósito, igual que Alertas/Sugerencias: no debe
      // tumbar la vista del menú.
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [idMenu]);

  function handleSuccessFormulario() {
    setMostrarFormulario(false);
    cargar();
  }

  async function handleEliminar(idRegistro) {
    if (!confirm("¿Eliminar este registro de cumplimiento?")) return;
    try {
      await eliminarCumplimiento(idPaciente, idMenu, idRegistro);
      cargar();
    } catch (err) {
      alert(err.message);
    }
  }

  if (cargando) return null;

  const diaPorId = new Map((dias || []).map((d) => [d.id, d.numeroDia]));

  return (
    <div className="mb-4 text-sm">
      <details className="border rounded-lg overflow-hidden">
        <summary className="cursor-pointer select-none px-3 py-1.5 flex items-center justify-between bg-gray-50">
          <span className="text-xs font-semibold text-nutri-navy">
            Cumplimiento del paciente ({registros.length})
          </span>
          {resumen?.porcentajeCumplimiento !== null && resumen?.porcentajeCumplimiento !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-nutri-green/15 text-nutri-green">
              {resumen.porcentajeCumplimiento}% de cumplimiento
            </span>
          )}
        </summary>

        <div className="p-3">
          {resumen && resumen.totalRegistros > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
              <div className="bg-white border rounded-lg py-2 px-1">
                <p className="text-[11px] text-gray-500 leading-tight">Comidas consumidas</p>
                <p className="text-sm font-semibold text-nutri-navy">
                  {resumen.totalComidasConsumidas}/{resumen.totalComidasPlaneadas}
                </p>
              </div>
              <div className="bg-white border rounded-lg py-2 px-1">
                <p className="text-[11px] text-gray-500 leading-tight">Agua promedio</p>
                <p className="text-sm font-semibold text-nutri-navy">
                  {resumen.promedioAgua !== undefined ? `${resumen.promedioAgua.toFixed(1)} L` : "—"}
                </p>
              </div>
              <div className="bg-white border rounded-lg py-2 px-1">
                <p className="text-[11px] text-gray-500 leading-tight">Hambre promedio</p>
                <p className="text-sm font-semibold text-nutri-navy">
                  {resumen.promedioNivelHambre !== undefined ? resumen.promedioNivelHambre.toFixed(1) : "—"}/5
                </p>
              </div>
              <div className="bg-white border rounded-lg py-2 px-1">
                <p className="text-[11px] text-gray-500 leading-tight">Energía promedio</p>
                <p className="text-sm font-semibold text-nutri-navy">
                  {resumen.promedioNivelEnergia !== undefined ? resumen.promedioNivelEnergia.toFixed(1) : "—"}/5
                </p>
              </div>
            </div>
          )}

          {resumen?.sintomasReportados?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {resumen.sintomasReportados.map((s) => (
                <span key={s} className="text-[11px] px-1.5 py-0.5 rounded-full bg-nutri-pink/10 text-nutri-pink">
                  {s}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setMostrarFormulario((v) => !v)}
            className="text-nutri-teal text-xs underline mb-2"
          >
            {mostrarFormulario ? "− Cancelar" : "+ Registrar cumplimiento"}
          </button>

          {mostrarFormulario && (
            <FormularioCumplimiento
              idPaciente={idPaciente}
              idMenu={idMenu}
              dias={dias || []}
              onSuccess={handleSuccessFormulario}
              onCancel={() => setMostrarFormulario(false)}
            />
          )}

          {registros.length > 0 && (
            <div className="mt-3 divide-y">
              {registros.map((r) => (
                <div key={r.id} className="py-1.5 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Día {diaPorId.get(r.idDiaMenu) ?? "?"}</span>
                    {" · "}
                    {new Date(r.fecha).toLocaleDateString()}
                    {" · "}
                    {r.comidasConsumidas.length} consumida{r.comidasConsumidas.length !== 1 ? "s" : ""}
                    {r.comidasOmitidas.length > 0 && `, ${r.comidasOmitidas.length} omitida(s)`}
                    {r.observaciones && ` — ${r.observaciones}`}
                  </p>
                  <button
                    onClick={() => handleEliminar(r.id)}
                    className="text-[11px] text-nutri-pink underline shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function FormularioCumplimiento({ idPaciente, idMenu, dias, onSuccess, onCancel }) {
  const [idDiaMenu, setIdDiaMenu] = useState(dias[0]?.id ?? "");
  const [estadoComidas, setEstadoComidas] = useState({}); // { [idComida]: "consumida" | "omitida" | "" }
  const [form, setForm] = useState({
    cantidadAgua: "",
    peso: "",
    nivelHambre: "",
    nivelEnergia: "",
    actividadFisica: "",
    sintomas: "",
    cambiosRealizados: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const diaSeleccionado = dias.find((d) => d.id === Number(idDiaMenu));

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEstadoComida(idComida, estado) {
    setEstadoComidas((prev) => ({ ...prev, [idComida]: prev[idComida] === estado ? "" : estado }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const comidasConsumidas = Object.entries(estadoComidas)
        .filter(([, estado]) => estado === "consumida")
        .map(([id]) => Number(id));
      const comidasOmitidas = Object.entries(estadoComidas)
        .filter(([, estado]) => estado === "omitida")
        .map(([id]) => Number(id));

      const datos = {
        idDiaMenu: Number(idDiaMenu),
        comidasConsumidas,
        comidasOmitidas,
        cantidadAgua: form.cantidadAgua === "" ? undefined : parseFloat(form.cantidadAgua),
        peso: form.peso === "" ? undefined : parseFloat(form.peso),
        nivelHambre: form.nivelHambre === "" ? undefined : parseInt(form.nivelHambre, 10),
        nivelEnergia: form.nivelEnergia === "" ? undefined : parseInt(form.nivelEnergia, 10),
        actividadFisica: form.actividadFisica || undefined,
        sintomas: form.sintomas
          ? form.sintomas.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        cambiosRealizados: form.cambiosRealizados || undefined,
        observaciones: form.observaciones || undefined,
      };
      await registrarCumplimiento(idPaciente, idMenu, datos);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      {error && <p className="bg-red-100 text-red-700 text-xs p-2 rounded mb-2">{error}</p>}

      <div className="mb-2">
        <label className={labelClass}>Día del menú *</label>
        <select
          value={idDiaMenu}
          onChange={(e) => {
            setIdDiaMenu(e.target.value);
            setEstadoComidas({});
          }}
          className={inputClass}
          required
        >
          {dias.map((d) => (
            <option key={d.id} value={d.id}>
              Día {d.numeroDia}
            </option>
          ))}
        </select>
      </div>

      {diaSeleccionado && (
        <div className="mb-2">
          <p className={labelClass}>Comidas de ese día</p>
          <div className="space-y-1">
            {diaSeleccionado.comidas.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-xs bg-white border rounded px-2 py-1">
                <span className="min-w-0 truncate">{c.tipoComida}: {c.nombrePlato}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEstadoComida(c.id, "consumida")}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      estadoComidas[c.id] === "consumida" ? "bg-nutri-green text-white" : "border border-gray-300"
                    }`}
                  >
                    Consumida
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEstadoComida(c.id, "omitida")}
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      estadoComidas[c.id] === "omitida" ? "bg-nutri-pink text-white" : "border border-gray-300"
                    }`}
                  >
                    Omitida
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        <div>
          <label className={labelClass}>Agua (L)</label>
          <input type="number" step="any" min="0" name="cantidadAgua" value={form.cantidadAgua} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Peso (kg)</label>
          <input type="number" step="any" min="0" name="peso" value={form.peso} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nivel de hambre (1-5)</label>
          <input type="number" min="1" max="5" step="1" name="nivelHambre" value={form.nivelHambre} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nivel de energía (1-5)</label>
          <input type="number" min="1" max="5" step="1" name="nivelEnergia" value={form.nivelEnergia} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="mb-2">
        <label className={labelClass}>Actividad física</label>
        <input type="text" name="actividadFisica" value={form.actividadFisica} onChange={handleChange} placeholder="Ej. 30 min de caminata" className={inputClass} />
      </div>
      <div className="mb-2">
        <label className={labelClass}>Síntomas o molestias (separados por coma)</label>
        <input type="text" name="sintomas" value={form.sintomas} onChange={handleChange} placeholder="Ej. dolor de cabeza, fatiga" className={inputClass} />
      </div>
      <div className="mb-2">
        <label className={labelClass}>Cambios realizados</label>
        <textarea name="cambiosRealizados" value={form.cambiosRealizados} onChange={handleChange} rows={2} className={inputClass} />
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

export default CumplimientoMenu;

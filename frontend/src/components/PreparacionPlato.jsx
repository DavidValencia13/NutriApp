import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChefHat, ListChecks, Plus, Timer, Trash2, X } from "lucide-react";
import { cantidadLegible } from "../utils/cantidad";
import { ACCIONES, textoMinutos } from "../utils/preparacion";

// Explicación de preparación de un plato: pasos cortos con ícono por acción.
// La usan el nutricionista (ver y corregir) y el paciente (ver y cocinar).
function IconoAccion({ accion, size = 20, className = "" }) {
  const { Icono } = ACCIONES[accion] || ACCIONES.cocinar;
  return <Icono size={size} strokeWidth={2} className={className} aria-hidden="true" />;
}

export function ListaPasos({ pasos, grande = false }) {
  return (
    <ol className="space-y-2.5">
      {pasos.map((paso, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
          <span className={`relative shrink-0 flex items-center justify-center rounded-xl bg-nutri-brand/10 text-nutri-brand ${grande ? "w-12 h-12" : "w-10 h-10"}`}>
            <IconoAccion accion={paso.accion} size={grande ? 24 : 20} />
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-nutri-brand text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-nutri-ink ${grande ? "text-base" : "text-sm"}`}>{paso.texto}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ACCIONES[paso.accion]?.nombre || "Cocinar"}
              {paso.minutos > 0 && <> · <Timer size={11} className="inline -mt-0.5" aria-hidden="true" /> {textoMinutos(paso.minutos)}</>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Vista del paciente: ingredientes para marcar, pasos y modo "paso a paso"
export function VistaPreparacion({ comida }) {
  const pasos = comida.preparacion?.pasos || [];
  const [listos, setListos] = useState({});
  const [pasoActual, setPasoActual] = useState(null);

  if (pasoActual !== null) {
    const paso = pasos[pasoActual];
    const ultimo = pasoActual === pasos.length - 1;
    return (
      <div className="flex flex-col min-h-[50vh]">
        <p className="text-xs font-semibold text-nutri-brand">Paso {pasoActual + 1} de {pasos.length}</p>
        <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
          <div className="h-full bg-nutri-brand rounded-full transition-all" style={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-4">
          <span className="w-24 h-24 rounded-3xl bg-nutri-brand/10 text-nutri-brand flex items-center justify-center">
            <IconoAccion accion={paso.accion} size={48} />
          </span>
          <p className="text-xl font-medium text-nutri-ink max-w-md">{paso.texto}</p>
          {paso.minutos > 0 && <p className="text-sm text-gray-500 flex items-center gap-1.5"><Timer size={15} aria-hidden="true" /> {textoMinutos(paso.minutos)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setPasoActual(pasoActual === 0 ? null : pasoActual - 1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-line py-3.5 font-semibold text-nutri-ink">
            <ArrowLeft size={18} aria-hidden="true" /> {pasoActual === 0 ? "Volver" : "Anterior"}
          </button>
          <button type="button" onClick={() => setPasoActual(ultimo ? null : pasoActual + 1)}
            className="flex items-center justify-center gap-2 rounded-xl bg-nutri-brand py-3.5 font-semibold text-white">
            {ultimo ? <><Check size={18} aria-hidden="true" /> ¡Listo!</> : <>Siguiente <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ChefHat size={18} className="text-nutri-brand" aria-hidden="true" />
        <span>{comida.nombrePlato}</span>
        {comida.preparacion?.minutosTotales > 0 && <span className="ml-auto flex items-center gap-1 text-gray-500"><Timer size={14} aria-hidden="true" /> {textoMinutos(comida.preparacion.minutosTotales)}</span>}
      </div>

      {(comida.detalles || []).length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-nutri-ink mb-2 flex items-center gap-1.5"><ListChecks size={16} aria-hidden="true" /> Necesitas</h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {comida.detalles.map((d, i) => {
              const marcado = Boolean(listos[i]);
              return (
                <li key={i}>
                  <button type="button" onClick={() => setListos((l) => ({ ...l, [i]: !l[i] }))} aria-pressed={marcado}
                    className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm ${marcado ? "border-nutri-green bg-nutri-green/10 text-gray-500 line-through" : "border-line bg-white text-nutri-ink"}`}>
                    <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center ${marcado ? "bg-nutri-green border-nutri-green text-white" : "border-gray-300"}`}>
                      {marcado && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                    </span>
                    {d.nombreAlimento} <span className="ml-auto text-gray-500 no-underline">{cantidadLegible(d.cantidadUtilizada, d.unidadMedida)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-nutri-ink mb-2">Cómo prepararlo</h3>
        <ListaPasos pasos={pasos} grande />
      </section>

      <button type="button" onClick={() => setPasoActual(0)}
        className="boton-preparacion w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white">
        <ChefHat size={19} aria-hidden="true" /> Cocinar paso a paso
      </button>
    </div>
  );
}

// Nutricionista: revisa y corrige los pasos antes de que los vea el paciente
export function EditorPreparacion({ comida, soloLectura = false, onGuardar, onCancelar, onRehacer, rehaciendo = false }) {
  const [pasos, setPasos] = useState(() => (comida.preparacion?.pasos || []).map((p) => ({ ...p })));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  if (soloLectura) {
    return pasos.length ? <ListaPasos pasos={pasos} /> : <p className="text-sm text-gray-500">Este plato no tiene explicación de preparación.</p>;
  }

  function cambiar(i, campo, valor) {
    setPasos((lista) => lista.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)));
  }

  async function guardar(lista) {
    setError("");
    setGuardando(true);
    try {
      const limpios = lista.filter((p) => String(p.texto || "").trim());
      await onGuardar(limpios.length ? { pasos: limpios.map((p) => ({ ...p, minutos: Number(p.minutos) || 0 })) } : null);
    } catch (err) {
      setError(err.message || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Revisa los pasos de <strong>{comida.nombrePlato}</strong>. El paciente los verá en su app con estos íconos.
      </p>
      <ol className="space-y-3">
        {pasos.map((paso, i) => (
          <li key={i} className="rounded-xl border border-line p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 shrink-0 rounded-lg bg-nutri-brand/10 text-nutri-brand flex items-center justify-center"><IconoAccion accion={paso.accion} size={18} /></span>
              <span className="text-xs font-semibold text-gray-500">Paso {i + 1}</span>
              <select value={paso.accion} onChange={(e) => cambiar(i, "accion", e.target.value)} aria-label={`Acción del paso ${i + 1}`}
                className="ml-auto rounded-lg border border-line bg-white px-2 py-1.5 text-sm">
                {Object.entries(ACCIONES).map(([valor, { nombre }]) => <option key={valor} value={valor}>{nombre}</option>)}
              </select>
              <label className="flex items-center gap-1 text-sm text-gray-500">
                <input type="number" min="0" max="180" value={paso.minutos} onChange={(e) => cambiar(i, "minutos", e.target.value)}
                  aria-label={`Minutos del paso ${i + 1}`} className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm" /> min
              </label>
              <button type="button" onClick={() => setPasos((l) => l.filter((_, j) => j !== i))} aria-label={`Quitar paso ${i + 1}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-nutri-pink hover:bg-gray-50"><Trash2 size={16} /></button>
            </div>
            <textarea value={paso.texto} onChange={(e) => cambiar(i, "texto", e.target.value)} maxLength={220} rows={2}
              aria-label={`Texto del paso ${i + 1}`} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </li>
        ))}
      </ol>
      {pasos.length < 8 && (
        <button type="button" onClick={() => setPasos((l) => [...l, { accion: "cocinar", texto: "", minutos: 0 }])}
          className="flex items-center gap-1.5 text-sm font-semibold text-nutri-brand"><Plus size={16} aria-hidden="true" /> Agregar paso</button>
      )}
      {error && <p className="text-sm text-nutri-pink">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        {comida.preparacion && (
          <button type="button" disabled={guardando} onClick={() => guardar([])} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-pink">
            Quitar explicación
          </button>
        )}
        {onRehacer && (
          <button type="button" disabled={guardando || rehaciendo} onClick={onRehacer} className="px-3 py-2 rounded-lg text-sm font-semibold text-[#c25e0c] hover:bg-orange-50 disabled:opacity-60">
            {rehaciendo ? "Rehaciendo…" : "Rehacer con IA"}
          </button>
        )}
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg border border-line text-sm">Cancelar</button>
        <button type="button" disabled={guardando} onClick={() => guardar(pasos)} className="px-4 py-2 rounded-lg bg-nutri-brand text-white text-sm font-semibold disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar pasos"}
        </button>
      </div>
    </div>
  );
}

// Paciente: pantalla completa en el celular (ventana centrada en escritorio)
export function HojaPreparacion({ comida, onCerrar }) {
  useEffect(() => {
    function alPresionar(e) { if (e.key === "Escape") onCerrar(); }
    document.addEventListener("keydown", alPresionar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: "rgba(15,42,32,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div role="dialog" aria-modal="true" aria-label={`Cómo preparar ${comida.nombrePlato}`}
        className="bg-surface w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-line shrink-0">
          <span className="boton-preparacion w-9 h-9 rounded-xl text-white flex items-center justify-center"><ChefHat size={19} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-nutri-brand">{comida.tipoComida}</p>
            <h2 className="font-semibold leading-tight truncate">Cómo prepararlo</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" autoFocus className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <VistaPreparacion comida={comida} />
        </div>
      </div>
    </div>
  );
}

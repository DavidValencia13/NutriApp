import { useEffect, useState } from "react";
import { NombreConBebida } from "./BebidaComida";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, ChefHat, CupSoda, ListChecks, Plus, Timer, Trash2, UtensilsCrossed, X } from "lucide-react";
import { cantidadLegible } from "../utils/cantidad";
import { ACCIONES, accion, emojiDeAlimento, ingredientesDelPaso, separarPasos, textoMinutos, textoSinBebida } from "../utils/preparacion";

// Explicación de preparación de un plato: pasos cortos con ícono de color
// por acción y dibujos de los ingredientes (todo local, no gasta IA).
// La usan el nutricionista (ver y corregir) y el paciente (ver y cocinar).
function IconoAccion({ clave, size = 20 }) {
  const { Icono } = accion(clave);
  return <Icono size={size} strokeWidth={2.2} aria-hidden="true" />;
}

function BurbujaAccion({ clave, tamano = 48, icono = 24, numero }) {
  const a = accion(clave);
  return (
    <span className="relative shrink-0 flex items-center justify-center rounded-full"
      style={{ width: tamano, height: tamano, color: a.color, background: a.fondo, boxShadow: `0 0 0 3px #fff, 0 0 0 4px ${a.fondo}` }}>
      <IconoAccion clave={clave} size={icono} />
      {numero !== undefined && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
          style={{ background: a.color }}>{numero}</span>
      )}
    </span>
  );
}

// Fila de íconos de acción: resumen visual de la receta (va en la tarjeta del paciente)
export function MiniPasos({ pasos, max = 6 }) {
  const visibles = pasos.slice(0, max);
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {visibles.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="w-2 h-px bg-current opacity-60" />}
          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-white" style={{ color: accion(p.accion).color }}>
            <IconoAccion clave={p.accion} size={13} />
          </span>
        </span>
      ))}
      {pasos.length > max && <span className="text-xs opacity-90">+{pasos.length - max}</span>}
    </span>
  );
}

export function ListaPasos({ pasos, detalles = [], inicio = 0 }) {
  return (
    <ol className="relative">
      {pasos.map((paso, i) => {
        const a = accion(paso.accion);
        const ingredientes = ingredientesDelPaso(paso.texto, detalles);
        const ultimo = i === pasos.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-4">
            {!ultimo && (
              <span className="absolute left-6 top-12 bottom-0 w-0.5 -ml-px" aria-hidden="true"
                style={{ background: `linear-gradient(${a.color}55, ${accion(pasos[i + 1].accion).color}55)` }} />
            )}
            <BurbujaAccion clave={paso.accion} numero={inicio + i + 1} />
            <div className="min-w-0 flex-1 rounded-2xl border-2 bg-white p-3" style={{ borderColor: a.fondo }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: a.color }}>{a.nombre}</span>
                {paso.minutos > 0 && (
                  <span className="text-xs font-semibold rounded-full px-2 py-0.5 flex items-center gap-1" style={{ color: a.color, background: a.fondo }}>
                    <Timer size={11} aria-hidden="true" /> {textoMinutos(paso.minutos)}
                  </span>
                )}
                {ingredientes.length > 0 && (
                  <span className="ml-auto flex gap-0.5 text-xl leading-none" title={ingredientes.map((d) => d.nombreAlimento).join(", ")}>
                    {ingredientes.map((d, k) => <span key={k}>{emojiDeAlimento(d.nombreAlimento)}</span>)}
                  </span>
                )}
              </div>
              <p className="text-[15px] text-nutri-ink mt-1 leading-snug">{paso.texto}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Apartados: primero el plato y después la bebida (si es preparada)
export function PasosPorApartado({ comida }) {
  const { plato, bebida } = separarPasos(comida);
  const detalles = comida.detalles || [];
  const pasosBebida = bebida.map((p) => ({ ...p, texto: textoSinBebida(p.texto, comida.bebida) }));
  return (
    <div className="space-y-4">
      {plato.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-nutri-ink mb-3 flex items-center gap-1.5"><UtensilsCrossed size={16} aria-hidden="true" /> Plato: <span className="font-normal">{comida.nombrePlato}</span></h3>
          <ListaPasos pasos={plato} detalles={detalles} />
        </section>
      )}
      {pasosBebida.length > 0 && (
        <section className="seccion-bebida">
          <h3 className="seccion-bebida-titulo"><CupSoda size={18} aria-hidden="true" /> Bebida: <span className="font-semibold">{comida.bebida}</span></h3>
          <ListaPasos pasos={pasosBebida} detalles={[]} inicio={plato.length} />
        </section>
      )}
    </div>
  );
}

const POSICIONES_BURBUJA = [
  { top: -6, right: -12 }, { bottom: -4, left: -14 }, { top: -6, left: -14 }, { bottom: -4, right: -14 },
];

// Vista del paciente: ingredientes con dibujo para marcar, pasos y modo "paso a paso"
export function VistaPreparacion({ comida }) {
  const pasos = comida.preparacion?.pasos || [];
  const detalles = comida.detalles || [];
  const [listos, setListos] = useState({});
  const [pasoActual, setPasoActual] = useState(null);

  if (pasoActual !== null) {
    const paso = pasos[pasoActual];
    const a = accion(paso.accion);
    const ultimo = pasoActual === pasos.length - 1;
    const esBebida = separarPasos(comida).bebida.some((p) => p.indice === pasoActual);
    const ingredientes = esBebida ? [] : ingredientesDelPaso(paso.texto, detalles);
    return (
      <div className="flex flex-col min-h-[60vh]">
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={pasoActual + 1}>
          {pasos.map((p, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i <= pasoActual ? accion(p.accion).color : "#e5e7eb" }} />
          ))}
        </div>
        <p className="text-xs font-bold mt-3" style={{ color: a.color }}>PASO {pasoActual + 1} DE {pasos.length}{esBebida && <span className="ml-2 text-sky-700">· BEBIDA: {comida.bebida}</span>}</p>
        <div key={pasoActual} className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-5 animate-fade-in-up">
          <div className="relative">
            <span className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{ color: a.color, background: a.fondo, boxShadow: `0 0 0 12px ${a.fondo}88` }}>
              <IconoAccion clave={paso.accion} size={68} />
            </span>
            {ingredientes.slice(0, 4).map((d, k) => (
              <span key={k} className="absolute w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl" style={POSICIONES_BURBUJA[k]}>
                {emojiDeAlimento(d.nombreAlimento)}
              </span>
            ))}
          </div>
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: a.color }}>{a.nombre}</p>
          <p className="text-xl font-medium text-nutri-ink max-w-md leading-snug">{esBebida ? textoSinBebida(paso.texto, comida.bebida) : paso.texto}</p>
          {paso.minutos > 0 && (
            <p className="text-base font-semibold rounded-full px-4 py-1.5 flex items-center gap-2" style={{ color: a.color, background: a.fondo }}>
              <Timer size={18} aria-hidden="true" /> {textoMinutos(paso.minutos)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setPasoActual(pasoActual === 0 ? null : pasoActual - 1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white py-3.5 font-semibold text-nutri-ink">
            <ArrowLeft size={18} aria-hidden="true" /> {pasoActual === 0 ? "Volver" : "Anterior"}
          </button>
          <button type="button" onClick={() => setPasoActual(ultimo ? null : pasoActual + 1)}
            className="boton-preparacion flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white">
            {ultimo ? <><Check size={18} aria-hidden="true" /> ¡Listo!</> : <>Siguiente <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-line p-4">
        <p className="font-semibold text-nutri-ink leading-snug"><NombreConBebida nombrePlato={comida.nombrePlato} bebida={comida.bebida} /></p>
        {detalles.length > 0 && (
          <p className="text-3xl mt-2 tracking-wider" aria-hidden="true">{detalles.map((d) => emojiDeAlimento(d.nombreAlimento)).join("")}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold">
          {comida.preparacion?.minutosTotales > 0 && (
            <span className="rounded-full px-2.5 py-1 bg-orange-50 text-[#c25e0c] flex items-center gap-1"><Timer size={13} aria-hidden="true" /> {textoMinutos(comida.preparacion.minutosTotales)}</span>
          )}
          <span className="rounded-full px-2.5 py-1 bg-orange-50 text-[#c25e0c] flex items-center gap-1"><ChefHat size={13} aria-hidden="true" /> {pasos.length} pasos</span>
          {detalles.length > 0 && <span className="rounded-full px-2.5 py-1 bg-orange-50 text-[#c25e0c]">{detalles.length} ingredientes</span>}
        </div>
      </div>

      {detalles.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-nutri-ink mb-2 flex items-center gap-1.5">
            <ListChecks size={16} aria-hidden="true" /> Necesitas <span className="font-normal text-gray-500">(toca para marcar)</span>
          </h3>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {detalles.map((d, i) => {
              const marcado = Boolean(listos[i]);
              return (
                <li key={i}>
                  <button type="button" onClick={() => setListos((l) => ({ ...l, [i]: !l[i] }))} aria-pressed={marcado}
                    className={`relative w-full h-full flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-center transition-all ${marcado ? "border-nutri-green bg-nutri-green/10 opacity-70" : "border-line bg-white hover:border-orange-300"}`}>
                    {marcado && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-nutri-green text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                    <span className="text-3xl leading-none mt-1" aria-hidden="true">{emojiDeAlimento(d.nombreAlimento)}</span>
                    <span className="text-xs font-semibold text-nutri-ink leading-tight">{d.nombreAlimento}</span>
                    <span className="text-[11px] text-gray-500">{cantidadLegible(d.cantidadUtilizada, d.unidadMedida)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {comida.bebida && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-sky-800">
              <CupSoda size={14} aria-hidden="true" /> <strong>Para la bebida:</strong>
              {(comida.bebidaNutricion?.ingredientes || []).length
                ? comida.bebidaNutricion.ingredientes.map((i, k) => <span key={k} className="tarjeta-bebida-chip">{i.nombre} · {i.medida || `${i.cantidad} ${i.unidad}`}</span>)
                : <span>{comida.bebida}{comida.bebidaNutricion?.ml ? ` (${comida.bebidaNutricion.ml} ml)` : ""}</span>}
            </p>
          )}
        </section>
      )}

      <PasosPorApartado comida={comida} />

      <button type="button" onClick={() => setPasoActual(0)}
        className="boton-preparacion sticky bottom-0 w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white text-base">
        <ChefHat size={20} aria-hidden="true" /> Cocinar paso a paso
      </button>
    </div>
  );
}

// Nutricionista: revisa y corrige los pasos antes de que los vea el paciente
export function EditorPreparacion({ comida, soloLectura = false, onGuardar, onCancelar, onRehacer, rehaciendo = false }) {
  const [pasos, setPasos] = useState(() => {
    const deBebida = new Set(separarPasos(comida).bebida.map((p) => p.indice));
    return (comida.preparacion?.pasos || []).map((p, i) => (deBebida.has(i)
      ? { ...p, bebida: true, texto: textoSinBebida(p.texto, comida.bebida) }
      : { ...p, bebida: false }));
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  if (soloLectura) {
    return pasos.length
      ? <PasosPorApartado comida={comida} />
      : <p className="text-sm text-gray-500">Este plato no tiene explicación de preparación.</p>;
  }

  function cambiar(i, campo, valor) {
    setPasos((lista) => lista.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)));
  }

  async function guardar(lista) {
    setError("");
    setGuardando(true);
    try {
      const limpios = lista.filter((p) => String(p.texto || "").trim());
      const ordenados = [...limpios.filter((p) => !p.bebida), ...limpios.filter((p) => p.bebida)];
      await onGuardar(ordenados.length ? { pasos: ordenados.map((p) => ({ accion: p.accion, texto: p.texto, minutos: Number(p.minutos) || 0, ...(p.bebida && { bebida: true }) })) } : null);
    } catch (err) {
      setError(err.message || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Revisa los pasos de <strong>{comida.nombrePlato}</strong>. El paciente los verá en su app con estos íconos y colores.
      </p>
      {[false, true].map((esBebida) => {
        if (esBebida && !comida.bebida && !pasos.some((p) => p.bebida)) return null;
        const filas = pasos.map((p, i) => ({ p, i })).filter(({ p }) => Boolean(p.bebida) === esBebida);
        const offset = esBebida ? pasos.filter((p) => !p.bebida).length : 0;
        return (
          <section key={String(esBebida)} className={esBebida ? "seccion-bebida pb-3" : ""}>
            <h3 className={esBebida ? "seccion-bebida-titulo" : "text-sm font-semibold text-nutri-ink mb-3 flex items-center gap-1.5"}>
              {esBebida ? <CupSoda size={18} aria-hidden="true" /> : <UtensilsCrossed size={16} aria-hidden="true" />}
              {esBebida ? "Bebida:" : "Plato:"} <span className="font-normal">{esBebida ? comida.bebida || "sin bebida" : comida.nombrePlato}</span>
            </h3>
            {filas.length === 0 && <p className="text-xs text-gray-500 mb-2">{esBebida ? "Sin pasos para la bebida." : "Sin pasos para el plato."}</p>}
            <ol className="space-y-3">
              {filas.map(({ p: paso, i }, k) => (
                <li key={i} className="rounded-xl border-2 p-3 space-y-2 bg-white" style={{ borderColor: accion(paso.accion).fondo }}>
                  <div className="flex items-center gap-2">
                    <BurbujaAccion clave={paso.accion} tamano={36} icono={18} />
                    <span className="text-xs font-semibold text-gray-500">Paso {offset + k + 1}</span>
                    <select value={paso.accion} onChange={(e) => cambiar(i, "accion", e.target.value)} aria-label={`Acción del paso ${offset + k + 1}`}
                      className="ml-auto rounded-lg border border-line bg-white px-2 py-1.5 text-sm">
                      {Object.entries(ACCIONES).map(([valor, { nombre }]) => <option key={valor} value={valor}>{nombre}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-sm text-gray-500">
                      <input type="number" min="0" max="180" value={paso.minutos} onChange={(e) => cambiar(i, "minutos", e.target.value)}
                        aria-label={`Minutos del paso ${offset + k + 1}`} className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm" /> min
                    </label>
                    <button type="button" onClick={() => setPasos((l) => l.filter((_, j) => j !== i))} aria-label={`Quitar paso ${offset + k + 1}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-nutri-pink hover:bg-gray-50"><Trash2 size={16} /></button>
                  </div>
                  <textarea value={paso.texto} onChange={(e) => cambiar(i, "texto", e.target.value)} maxLength={220} rows={2}
                    aria-label={`Texto del paso ${offset + k + 1}`} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                </li>
              ))}
            </ol>
            {pasos.length < 8 && (
              <button type="button" onClick={() => setPasos((l) => [...l, { accion: esBebida ? "licuar" : "cocinar", texto: "", minutos: 0, bebida: esBebida }])}
                className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${esBebida ? "text-sky-700" : "text-nutri-brand"}`}>
                <Plus size={16} aria-hidden="true" /> {esBebida ? "Agregar paso de la bebida" : "Agregar paso del plato"}
              </button>
            )}
          </section>
        );
      })}
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

  // Se dibuja en <body> (portal): dentro de la tarjeta, su animación recortaba la ventana
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6" style={{ background: "rgba(15,42,32,0.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div role="dialog" aria-modal="true" aria-label={`Cómo preparar ${comida.nombrePlato}`}
        className="bg-surface w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
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
    </div>,
    document.body,
  );
}

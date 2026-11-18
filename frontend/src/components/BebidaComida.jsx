import { useState } from "react";
import { CupSoda, Loader2, Search } from "lucide-react";
import { buscarInfoNutricional } from "../services/alimentoService";

// Bebida que acompaña una comida. Agua e infusiones sin azúcar no aportan
// calorías; las que sí (jugo, leche, colada...) se buscan en las mismas
// tablas que los alimentos (USDA / USFQ, por 100 ml) y se SUMAN a la comida.
const SIN_CALORIAS = [
  "Vaso de agua (250 ml)",
  "Agua aromática sin azúcar (manzanilla, hierba luisa o cedrón)",
  "Agua de canela sin azúcar",
  "Té verde sin azúcar",
];
const CON_CALORIAS = [
  { nombre: "Jugo natural de naranja sin azúcar", buscar: "jugo de naranja", ml: 200 },
  { nombre: "Leche semidescremada", buscar: "leche semidescremada", ml: 250 },
  { nombre: "Leche de avena sin azúcar", buscar: "leche de avena", ml: 250 },
  { nombre: "Yogur bebible natural", buscar: "yogur natural", ml: 200 },
];

const fmt = (n, d = 0) => Number(n || 0).toLocaleString("es-EC", { maximumFractionDigits: d });

export function EditorBebida({ idPaciente, comida, onGuardar, onCancelar }) {
  const previa = comida.bebidaNutricion;
  const [nombre, setNombre] = useState(comida.bebida || "");
  const [conCalorias, setConCalorias] = useState(Boolean(previa));
  const [ml, setMl] = useState(previa?.ml ? String(previa.ml) : "200");
  // ficha por 100 ml; si se está editando una bebida guardada se reconstruye
  const [ficha, setFicha] = useState(() => (previa?.nutrientes && previa.ml
    ? {
      fuente: previa.fuente, nombreEncontrado: previa.referencia,
      ...Object.fromEntries(Object.entries(previa.nutrientes).map(([k, v]) => [k, (v * 100) / previa.ml])),
    }
    : null));
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function buscar(termino) {
    if (!termino.trim()) { setError("Escribe el nombre de la bebida para buscarla."); return; }
    setError("");
    setBuscando(true);
    setFicha(null);
    try {
      const r = await buscarInfoNutricional(idPaciente, termino);
      if (!r || r.calorias == null) setError(`No se encontró "${termino}" en las tablas. Prueba con un nombre más simple (ej.: "jugo de naranja", "leche entera").`);
      else setFicha(r);
    } catch (err) {
      setError(err.message || "No se pudo consultar la tabla nutricional");
    } finally {
      setBuscando(false);
    }
  }

  function elegirSinCalorias(texto) {
    setNombre(texto);
    setConCalorias(false);
    setFicha(null);
    setError("");
  }

  function elegirConCalorias(op) {
    setNombre(op.nombre);
    setConCalorias(true);
    setMl(String(op.ml));
    buscar(op.buscar);
  }

  async function guardar(quitar = false) {
    setError("");
    if (!quitar && conCalorias && !ficha) { setError("Busca la bebida en las tablas para calcular sus calorías, o márcala como sin calorías."); return; }
    setGuardando(true);
    try {
      if (quitar) await onGuardar({ bebida: null });
      else if (conCalorias) {
        await onGuardar({ bebida: nombre.trim(), ml: Number(ml), por100: ficha, fuente: ficha.fuente, referencia: ficha.nombreEncontrado });
      } else await onGuardar({ bebida: nombre.trim() });
    } catch (err) {
      setError(err.message || "No se pudo guardar");
      setGuardando(false);
    }
  }

  const cantidad = Number(ml) || 0;
  const porcion = ficha ? (campo) => (Number(ficha[campo]) || 0) * cantidad / 100 : null;
  const chip = (activo) => `text-xs rounded-full px-3 py-1.5 border transition-colors ${activo ? "border-nutri-brand bg-nutri-brand text-white" : "border-line text-gray-600 hover:border-nutri-brand"}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Bebida para <strong>{comida.tipoComida.toLowerCase()}</strong> · {comida.nombrePlato}</p>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Sin calorías</p>
        <div className="flex flex-wrap gap-2">
          {SIN_CALORIAS.map((s) => <button key={s} type="button" onClick={() => elegirSinCalorias(s)} aria-pressed={nombre === s} className={chip(nombre === s)}>{s}</button>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Con calorías (se suman a la comida)</p>
        <div className="flex flex-wrap gap-2">
          {CON_CALORIAS.map((op) => <button key={op.nombre} type="button" onClick={() => elegirConCalorias(op)} aria-pressed={nombre === op.nombre} className={chip(nombre === op.nombre)}>{op.nombre}</button>)}
        </div>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-nutri-ink">Bebida</span>
          <input type="text" value={nombre} maxLength={160} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Jugo de mora sin azúcar"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-nutri-ink">
          <input type="checkbox" checked={conCalorias} onChange={(e) => { setConCalorias(e.target.checked); if (!e.target.checked) setFicha(null); }} />
          Tiene calorías (jugo, leche, colada, batido…)
        </label>

        {conCalorias && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Cantidad</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <input type="number" min="10" max="1000" step="10" value={ml} onChange={(e) => setMl(e.target.value)} className="w-24 rounded-lg border border-line px-3 py-2 text-sm" />
                  <span className="text-sm text-gray-500">ml</span>
                </span>
              </label>
              <button type="button" onClick={() => buscar(nombre)} disabled={buscando}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nutri-brand text-sm font-semibold text-nutri-brand hover:bg-nutri-brand/5 disabled:opacity-60">
                {buscando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Search size={15} aria-hidden="true" />} Buscar en tablas
              </button>
            </div>
            {buscando && <p className="text-xs text-gray-500">Consultando la tabla nutricional…</p>}
            {ficha && (
              <div className="rounded-lg bg-surface p-3 text-sm">
                <p className="text-xs text-gray-500">Ficha {ficha.fuente || "nutricional"} · {ficha.nombreEncontrado || "referencia"} · {fmt(ficha.calorias)} kcal por 100 ml</p>
                <p className="mt-1 font-semibold text-nutri-ink">{fmt(cantidad)} ml = {fmt(porcion("calorias"))} kcal</p>
                <p className="text-xs text-gray-600">Proteínas {fmt(porcion("proteinas"), 1)} g · Carbohidratos {fmt(porcion("carbohidratos"), 1)} g · Grasas {fmt(porcion("grasasTotales"), 1)} g{ficha.azucares != null ? ` · Azúcares ${fmt(porcion("azucares"), 1)} g` : ""}</p>
                {Number(ficha.calorias) > 150 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-700">
                    Ojo: {fmt(ficha.calorias)} kcal por 100 parece la ficha de un alimento seco o en polvo, no de la bebida preparada. Busca un nombre más preciso (ej.: "leche de avena", "jugo de mora").
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {conCalorias ? "Las calorías y nutrientes de esta bebida se suman a la comida y al total del día." : "Agua e infusiones sin azúcar no suman calorías."}
      </p>
      {error && <p className="text-sm text-nutri-pink">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        {comida.bebida && (
          <button type="button" disabled={guardando} onClick={() => guardar(true)} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-pink">Quitar bebida</button>
        )}
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg border border-line text-sm">Cancelar</button>
        <button type="button" disabled={guardando || buscando || !nombre.trim()} onClick={() => guardar(false)}
          className="px-4 py-2 rounded-lg bg-nutri-brand text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
          {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Guardar bebida
        </button>
      </div>
    </div>
  );
}

// Línea que ve el paciente (y el nutricionista) dentro de la comida
export function LineaBebida({ bebida, nutricion, className = "" }) {
  if (!bebida) return null;
  return (
    <p className={`flex items-start gap-1.5 text-sm ${className}`}>
      <CupSoda size={16} className="shrink-0 mt-0.5 text-sky-600" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Bebida:</strong> {bebida}
        {nutricion?.ml ? <span className="text-gray-500"> · {nutricion.ml} ml · {Math.round(nutricion.nutrientes?.calorias || 0)} kcal</span> : null}
      </span>
    </p>
  );
}

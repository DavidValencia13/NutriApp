import { useEffect, useState } from "react";
import { Calculator, Loader2, Pencil, PieChart } from "lucide-react";
import { guardarProteinaPorKg, obtenerRequerimiento } from "../services/menuService";

// Para el profesional: de dónde sale la meta de calorías (fórmula y cada
// paso) y la distribución de macronutrientes en g, kcal y %, comparada con
// el promedio diario del menú. Son dos tarjetas: el cálculo (columna
// izquierda) y los macronutrientes (bajo las comidas).
const fmt = (n, d = 0) => Number(n).toLocaleString("es-EC", { minimumFractionDigits: d, maximumFractionDigits: d });
const coma = (n) => String(n).replace(".", ",");

const MACROS = [
  { clave: "proteinas", nombre: "Proteínas", campoMenu: "proteinas", kcalPorG: 4, color: "#0ea5e9", fondo: "#e0f2fe" },
  { clave: "carbohidratos", nombre: "Carbohidratos", campoMenu: "carbohidratos", kcalPorG: 4, color: "#f59e0b", fondo: "#fef3c7" },
  { clave: "grasas", nombre: "Grasas", campoMenu: "grasasTotales", kcalPorG: 9, color: "#a855f7", fondo: "#f3e8ff" },
];

function useRequerimiento(idPaciente) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    let vigente = true;
    obtenerRequerimiento(idPaciente).then((d) => { if (vigente) setDatos(d); }).catch(() => {});
    return () => { vigente = false; };
  }, [idPaciente]);
  return [datos, setDatos];
}

function Paso({ numero, titulo, detalle, resultado }) {
  return (
    <li className="flex gap-2.5 py-2">
      <span className="w-5 h-5 shrink-0 rounded-full bg-nutri-brand/10 text-nutri-brand text-[11px] font-bold flex items-center justify-center mt-0.5">{numero}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <strong className="text-xs text-nutri-ink">{titulo}</strong>
          <span className="ml-auto text-xs font-semibold text-nutri-ink tabular whitespace-nowrap">{resultado}</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{detalle}</p>
      </div>
    </li>
  );
}

// Columna izquierda: la meta de calorías y cómo se calculó (siempre visible)
export function CalculoRequerimiento({ idPaciente }) {
  const [datos] = useRequerimiento(idPaciente);
  if (!datos) return null;
  const v = datos.valores;
  const signoSexo = v.sexo === "masculino" ? "+ 5" : v.sexo === "femenino" ? "− 161" : "− 78";
  const ajuste = datos.ajusteObjetivo;

  return (
    <section className="weekly-side-card">
      <div className="weekly-side-heading"><span className="weekly-side-icon"><Calculator size={20} aria-hidden="true" /></span><strong>Requerimiento energético</strong></div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold text-nutri-ink tabular">{fmt(datos.meta)} <span className="text-sm font-normal text-gray-500">kcal/día</span></p>
      </div>
      <p className="text-[11px] text-gray-500">Fórmula <strong className="text-nutri-ink">{datos.formula}</strong></p>

      <ol className="mt-2 divide-y divide-line border-t border-line">
        <Paso numero={1} titulo="Tasa metabólica basal" resultado={`${fmt(datos.tmb)} kcal`}
          detalle={`10 × ${fmt(v.peso, 1)} kg + 6,25 × ${v.tallaCm} cm − 5 × ${v.edad} años ${signoSexo}`} />
        <Paso numero={2} titulo="Gasto energético total" resultado={`${fmt(datos.get)} kcal`}
          detalle={`TMB × ${coma(datos.factorActividad)} (actividad ${String(datos.nivelActividad).toLowerCase()})`} />
        <Paso numero={3} titulo="Ajuste por objetivo" resultado={`${ajuste > 0 ? "+" : ajuste < 0 ? "−" : "±"}${fmt(Math.abs(ajuste))} kcal`}
          detalle={datos.objetivo} />
      </ol>
      <div className="flex items-baseline justify-between rounded-lg bg-nutri-brand/5 px-2.5 py-1.5 mt-1">
        <strong className="text-xs text-nutri-ink">Meta diaria</strong>
        <span className="text-sm font-bold text-nutri-brand tabular">{fmt(datos.meta)} kcal</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Redondeada a 10 kcal.</p>
      {datos.minimoAplicado && <p className="text-[11px] text-amber-700 mt-1">Se aplicó el mínimo seguro de {fmt(datos.minimoSeguro)} kcal.</p>}
      {(v.edadSupuesta || v.sexoSupuesto) && (
        <p className="text-[11px] text-amber-700 mt-1">
          {v.edadSupuesta && "Sin edad en la ficha: se usaron 30 años. "}
          {v.sexoSupuesto && "Sin sexo en la ficha: se usó un valor promedio. "}
          Complétalos para un cálculo exacto.
        </p>
      )}
      <p className="text-[10px] text-gray-400 mt-2 leading-snug">{datos.referencias}</p>
    </section>
  );
}

// Bajo las comidas: distribución de macronutrientes (meta vs. menú) y
// ajuste de la proteína por kg
export function MacronutrientesMenu({ idPaciente, resumenSemanal }) {
  const [datos, setDatos] = useRequerimiento(idPaciente);
  const [editandoProteina, setEditandoProteina] = useState(false);
  const [proteinaTexto, setProteinaTexto] = useState("");
  const [guardandoProteina, setGuardandoProteina] = useState(false);
  const [errorProteina, setErrorProteina] = useState("");
  const [proteinaCambiada, setProteinaCambiada] = useState(false);

  async function guardarProteina(valor) {
    setErrorProteina("");
    setGuardandoProteina(true);
    try {
      setDatos(await guardarProteinaPorKg(idPaciente, valor));
      setEditandoProteina(false);
      setProteinaCambiada(true);
    } catch (err) {
      setErrorProteina(err.message || "No se pudo guardar");
    } finally {
      setGuardandoProteina(false);
    }
  }

  if (!datos) return null;
  const n = resumenSemanal?.nutrientes || {};
  const menuKcal = MACROS.reduce((t, m) => t + (Number(n[m.campoMenu]) || 0) / 7 * m.kcalPorG, 0);

  return (
    <section className="weekly-side-card macros-menu">
      <div className="weekly-side-heading">
        <span className="weekly-side-icon"><PieChart size={20} aria-hidden="true" /></span>
        <strong>Distribución de macronutrientes</strong>
        <span className="ml-auto text-[11px] font-normal text-gray-500">Meta: {fmt(datos.meta)} kcal/día</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden mb-3" aria-hidden="true">
        {MACROS.map((m) => <span key={m.clave} style={{ width: `${datos.macronutrientes[m.clave].porcentaje}%`, background: m.color }} />)}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {MACROS.map((m) => {
          const meta = datos.macronutrientes[m.clave];
          const gMenu = n[m.campoMenu] !== undefined ? Number(n[m.campoMenu]) / 7 : null;
          const kcalMenu = gMenu !== null ? gMenu * m.kcalPorG : null;
          const esProteina = m.clave === "proteinas" && datos.proteina;
          const nota = esProteina
            ? `${coma(datos.proteina.porKg)} g por kg de peso ${datos.proteina.personalizada ? "(ajustado por ti)" : "según el objetivo"}`
            : m.clave === "grasas" ? "30 % de las calorías" : "Resto de las calorías";
          return (
            <div key={m.clave} className="macro-tarjeta" style={{ borderTopColor: m.color }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-nutri-ink flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />{m.nombre}</span>
                <span className="text-xl font-bold tabular" style={{ color: m.color }}>{meta.porcentaje}%</span>
              </div>
              <p className="text-lg font-semibold text-nutri-ink tabular leading-tight mt-1">{fmt(meta.gramos)} g <span className="text-xs font-normal text-gray-500">= {fmt(meta.kcal)} kcal</span></p>
              <p className="text-[11px] text-gray-500 mt-0.5">{nota}</p>
              {gMenu !== null && (
                <p className="text-[11px] mt-1.5 rounded-md px-2 py-1 tabular" style={{ background: m.fondo, color: "#334155" }}>
                  Menú: <strong>{fmt(gMenu)} g</strong> · {fmt(kcalMenu)} kcal{menuKcal > 0 ? ` · ${Math.round((kcalMenu / menuKcal) * 100)}%` : ""}
                </p>
              )}
              {esProteina && !editandoProteina && (
                <button type="button" onClick={() => { setProteinaTexto(String(datos.proteina.porKg)); setEditandoProteina(true); }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-nutri-brand">
                  <Pencil size={11} aria-hidden="true" /> Ajustar g/kg
                </button>
              )}
              {esProteina && editandoProteina && (
                <form className="mt-1.5 flex flex-wrap items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); guardarProteina(proteinaTexto); }}>
                  <input type="number" step="0.1" min={datos.proteina.minimo} max={datos.proteina.maximo} value={proteinaTexto} autoFocus
                    onChange={(e) => setProteinaTexto(e.target.value)} aria-label="Gramos de proteína por kg de peso"
                    className="w-16 rounded-md border border-line px-2 py-1 text-xs" />
                  <span className="text-[11px] text-gray-500">g/kg = {fmt((Number(proteinaTexto) || 0) * datos.valores.peso)} g/día</span>
                  <button type="submit" disabled={guardandoProteina} className="rounded-md bg-nutri-brand px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60">
                    {guardandoProteina ? <Loader2 size={12} className="animate-spin" aria-label="Guardando" /> : "Guardar"}
                  </button>
                  {datos.proteina.personalizada && (
                    <button type="button" disabled={guardandoProteina} onClick={() => guardarProteina(null)} className="text-[11px] font-semibold text-nutri-brand">
                      Usar sugerido ({coma(datos.proteina.sugeridaPorKg)})
                    </button>
                  )}
                  <button type="button" onClick={() => { setEditandoProteina(false); setErrorProteina(""); }} className="text-[11px] text-gray-500">Cancelar</button>
                  <span className="basis-full text-[10px] text-gray-400">Rango: {coma(datos.proteina.minimo)} a {datos.proteina.maximo} g/kg (deportistas 1,6–2,2).</span>
                  {errorProteina && <span className="basis-full text-[11px] text-nutri-pink">{errorProteina}</span>}
                </form>
              )}
              {esProteina && proteinaCambiada && !editandoProteina && (
                <p className="text-[11px] text-amber-700 mt-1">Guardado. Se aplicará al generar el próximo menú.</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">1 g de proteína o carbohidrato = 4 kcal; 1 g de grasa = 9 kcal. "Menú" es el promedio diario del menú generado.</p>
    </section>
  );
}

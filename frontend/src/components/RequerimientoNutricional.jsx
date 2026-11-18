import { useEffect, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import { obtenerRequerimiento } from "../services/menuService";

// Para el profesional: de dónde sale la meta de calorías (fórmula y cada
// paso) y la distribución de macronutrientes en g, kcal y %, comparada con
// el promedio diario del menú.
const fmt = (n, d = 0) => Number(n).toLocaleString("es-EC", { minimumFractionDigits: d, maximumFractionDigits: d });

const MACROS = [
  { clave: "proteinas", nombre: "Proteínas", campoMenu: "proteinas", kcalPorG: 4, color: "#0ea5e9" },
  { clave: "carbohidratos", nombre: "Carbohidratos", campoMenu: "carbohidratos", kcalPorG: 4, color: "#f59e0b" },
  { clave: "grasas", nombre: "Grasas", campoMenu: "grasasTotales", kcalPorG: 9, color: "#a855f7" },
];

// ancho: tarjeta a lo ancho bajo las comidas (cálculo | macronutrientes)
function RequerimientoNutricional({ idPaciente, resumenSemanal, ancho = false }) {
  const [datos, setDatos] = useState(null);
  const [verCalculo, setVerCalculo] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerRequerimiento(idPaciente).then((d) => { if (vigente) setDatos(d); }).catch(() => {});
    return () => { vigente = false; };
  }, [idPaciente]);

  if (!datos) return null;
  const v = datos.valores;
  const n = resumenSemanal?.nutrientes || {};
  const menuKcal = MACROS.reduce((t, m) => t + (Number(n[m.campoMenu]) || 0) / 7 * m.kcalPorG, 0);

  return (
    <section className={`weekly-side-card ${ancho ? "mt-3" : ""}`}>
      <div className="weekly-side-heading"><span className="weekly-side-icon"><Calculator size={20} aria-hidden="true" /></span><strong>Requerimiento energético y macronutrientes</strong></div>
      <div className={ancho ? "grid md:grid-cols-2 gap-x-8 gap-y-3" : ""}>
      <div>
      <p className="text-2xl font-semibold text-nutri-ink tabular mt-1">{fmt(datos.meta)} <span className="text-sm font-normal text-gray-500">kcal/día</span></p>
      <p className="text-xs text-gray-500">Fórmula: <strong className="text-nutri-ink">{datos.formula}</strong></p>

      <button type="button" onClick={() => setVerCalculo((x) => !x)} aria-expanded={verCalculo}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-nutri-brand">
        {verCalculo ? "Ocultar cálculo" : "Ver cómo se calculó"}
        <ChevronDown size={14} className={verCalculo ? "rotate-180" : ""} aria-hidden="true" />
      </button>
      {verCalculo && (
        <ol className="mt-2 space-y-1.5 text-xs text-gray-600">
          <li>
            <strong className="text-nutri-ink">1. Tasa metabólica basal (TMB)</strong><br />
            <span className="text-[11px]">{datos.ecuacion}</span><br />
            = 10 × {fmt(v.peso, 1)} + 6,25 × {v.tallaCm} − 5 × {v.edad}{v.sexo === "masculino" ? " + 5" : v.sexo === "femenino" ? " − 161" : " − 78"} = <strong className="text-nutri-ink">{fmt(datos.tmb)} kcal</strong>
          </li>
          <li>
            <strong className="text-nutri-ink">2. Gasto energético total (GET)</strong><br />
            TMB × factor de actividad {datos.nivelActividad} ({String(datos.factorActividad).replace(".", ",")}) = <strong className="text-nutri-ink">{fmt(datos.get)} kcal</strong>
          </li>
          <li>
            <strong className="text-nutri-ink">3. Ajuste por objetivo</strong><br />
            {datos.objetivo}: {datos.ajusteObjetivo > 0 ? "+" : datos.ajusteObjetivo < 0 ? "−" : "±"}{fmt(Math.abs(datos.ajusteObjetivo))} kcal
          </li>
          <li className="pt-1 border-t border-line">
            <strong className="text-nutri-ink">Meta diaria: {fmt(datos.meta)} kcal</strong> (redondeada a 10 kcal)
            {datos.minimoAplicado && <><br /><span className="text-amber-700">Se aplicó el mínimo seguro de {fmt(datos.minimoSeguro)} kcal.</span></>}
          </li>
          {(v.edadSupuesta || v.sexoSupuesto) && (
            <li className="text-amber-700">
              {v.edadSupuesta && "Sin edad en la ficha: se usaron 30 años. "}
              {v.sexoSupuesto && "Sin sexo en la ficha: se usó un valor promedio. "}
              Complétalos para un cálculo exacto.
            </li>
          )}
        </ol>
      )}

      </div>
      <div className={ancho ? "md:border-l md:border-line md:pl-8" : "mt-3 pt-3 border-t border-line"}>
        <p className="text-xs font-semibold text-nutri-ink mb-1.5">Distribución de macronutrientes</p>
        <div className="flex h-2.5 rounded-full overflow-hidden mb-2" aria-hidden="true">
          {MACROS.map((m) => <span key={m.clave} style={{ width: `${datos.macronutrientes[m.clave].porcentaje}%`, background: m.color }} />)}
        </div>
        <ul className="space-y-2">
          {MACROS.map((m) => {
            const meta = datos.macronutrientes[m.clave];
            const gMenu = n[m.campoMenu] !== undefined ? Number(n[m.campoMenu]) / 7 : null;
            const kcalMenu = gMenu !== null ? gMenu * m.kcalPorG : null;
            return (
              <li key={m.clave} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <strong className="text-nutri-ink">{m.nombre}</strong>
                  <span className="ml-auto tabular font-bold" style={{ color: m.color }}>{meta.porcentaje} %</span>
                </div>
                <p className="pl-4 tabular text-nutri-ink font-semibold">{fmt(meta.gramos)} g = {fmt(meta.kcal)} kcal</p>
                <p className="text-[11px] text-gray-500 pl-4">{meta.nota}</p>
                {gMenu !== null && (
                  <p className="text-[11px] text-gray-500 pl-4">
                    Menú (promedio diario): <span className="tabular">{fmt(gMenu)} g · {fmt(kcalMenu)} kcal{menuKcal > 0 ? ` · ${Math.round((kcalMenu / menuKcal) * 100)} %` : ""}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-[10px] text-gray-400 mt-2 leading-snug">1 g de proteína o carbohidrato = 4 kcal; 1 g de grasa = 9 kcal. {datos.referencias}</p>
      </div>
      </div>
    </section>
  );
}

export default RequerimientoNutricional;

import { ArrowDown, ArrowUp, ChevronDown, FlaskConical } from "lucide-react";
import { ordenarControles } from "../utils/ordenarControles";
import { ESTADOS_LAB, GRUPOS_LABORATORIO, fmtLab } from "../utils/laboratorio";

// Exámenes de laboratorio básicos (opcionales) en cada control: glucosa,
// perfil lipídico y biometría. Para el control entre citas; no cambian el menú.
export function FormularioLaboratorio({ valores, onChange, abierto, onToggle, idBase }) {
  const input = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm";
  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white">
      <button type="button" onClick={onToggle} aria-expanded={abierto}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-nutri-ink">
        <FlaskConical size={15} className="text-nutri-brand" aria-hidden="true" />
        Exámenes de laboratorio <span className="font-normal text-gray-500">(opcional)</span>
        <ChevronDown size={16} className={`ml-auto transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-gray-500">Escribe solo los resultados que tenga el paciente. Sirven para el control entre citas.</p>
          {GRUPOS_LABORATORIO.map((g) => (
            <fieldset key={g.clave} className="rounded-lg bg-gray-50 p-2.5">
              <legend className="text-xs font-semibold text-nutri-ink px-1">{g.titulo}</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {g.campos.map((c) => (
                  <div key={c.campo}>
                    <label htmlFor={`${idBase}-${c.campo}`} className="block mb-1 text-[11px] font-medium text-gray-600">
                      {c.nombre} <span className="font-normal text-gray-400">({c.unidad})</span>
                    </label>
                    <input id={`${idBase}-${c.campo}`} type="text" inputMode="decimal" value={valores[c.campo]} placeholder={`Ej. ${c.ejemplo}`}
                      onChange={(e) => onChange({ ...valores, [c.campo]: e.target.value })} className={input} title={c.referencia} />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}

// Últimos resultados con su estado y el cambio frente al examen anterior
export default function PanelLaboratorio({ registros }) {
  const conLab = [...(registros || [])].filter((r) => r.laboratorio).sort(ordenarControles);
  if (conLab.length === 0) return null;
  const ultimo = conLab.at(-1);
  const anterior = conLab.length > 1 ? conLab.at(-2) : null;
  const fecha = (v) => new Date(v).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const alertas = Object.values(ultimo.evaluacionLaboratorio || {}).filter((e) => e && e !== "normal").length;

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-nutri-brand/10 text-nutri-brand flex items-center justify-center"><FlaskConical size={17} aria-hidden="true" /></span>
        <div>
          <h3 className="text-sm font-semibold text-nutri-ink">Exámenes de laboratorio</h3>
          <p className="text-[11px] text-gray-500">Último: {fecha(ultimo.fecha)}{anterior ? ` · comparado con ${fecha(anterior.fecha)}` : ""}</p>
        </div>
        <span className={`ml-auto text-[11px] font-semibold rounded-full px-2.5 py-1 ${alertas ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {alertas ? `${alertas} ${alertas === 1 ? "valor" : "valores"} fuera de rango` : "Todo en rango"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {GRUPOS_LABORATORIO.map((g) => {
          const campos = g.campos.filter((c) => ultimo.laboratorio[c.campo] != null);
          if (campos.length === 0) return null;
          return (
            <div key={g.clave} className="rounded-lg border border-line p-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">{g.titulo}</p>
              <ul className="space-y-1.5">
                {campos.map((c) => {
                  const valor = ultimo.laboratorio[c.campo];
                  const estado = ESTADOS_LAB[ultimo.evaluacionLaboratorio?.[c.campo]];
                  const previo = anterior?.laboratorio?.[c.campo];
                  const diferencia = previo != null ? valor - previo : null;
                  return (
                    <li key={c.campo} title={c.referencia}>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-nutri-ink">{c.nombre}</span>
                        <strong className="ml-auto tabular text-nutri-ink">{fmtLab(valor)}</strong>
                        <span className="text-[10px] text-gray-400">{c.unidad}</span>
                        {estado && <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${estado.clase}`}>{estado.texto}</span>}
                      </div>
                      {diferencia !== null && Math.abs(diferencia) > 0 && (
                        <p className="text-[10px] text-gray-500 flex items-center justify-end gap-0.5">
                          {diferencia > 0 ? <ArrowUp size={10} aria-hidden="true" /> : <ArrowDown size={10} aria-hidden="true" />}
                          {fmtLab(Math.abs(diferencia))} desde el anterior ({fmtLab(previo)})
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">Referencias en adultos: glucosa y HbA1c (ADA), lípidos (NCEP ATP III), biometría (valores habituales; OMS para anemia). Pasa el cursor sobre un valor para ver su rango.</p>
    </section>
  );
}

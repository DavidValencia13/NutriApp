import { useState } from "react";
import { Activity, ChevronDown, Dumbbell, Info, Ruler, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { EXPLICACION, PLIEGUES, controlesConComposicion, formato, semaforo } from "../utils/composicion";

// ── Formulario: medidas corporales opcionales del control (nutricionista) ──
export function FormularioMedidas({ medidas, onChange, abierto, onToggle, idBase }) {
  const cambiar = (campo) => (e) => onChange({ ...medidas, [campo]: e.target.value });
  const cambiarPliegue = (campo) => (e) => onChange({ ...medidas, pliegues: { ...medidas.pliegues, [campo]: e.target.value } });
  const input = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm";
  const label = "block mb-1 text-[11px] font-medium text-gray-600";
  const Campo = ({ id, texto, valor, onChange: alCambiar, placeholder }) => (
    <div>
      <label htmlFor={id} className={label}>{texto}</label>
      <input id={id} type="number" step="any" min="0" inputMode="decimal" value={valor} onChange={alCambiar} placeholder={placeholder} className={input} />
    </div>
  );

  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white">
      <button type="button" onClick={onToggle} aria-expanded={abierto}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-nutri-ink">
        <Ruler size={15} className="text-nutri-brand" aria-hidden="true" />
        Medidas corporales <span className="font-normal text-gray-500">(opcional)</span>
        <ChevronDown size={16} className={`ml-auto transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-gray-500">Llena solo lo que puedas medir con tu equipo. Puedes combinar las tres formas.</p>

          <fieldset className="rounded-lg bg-gray-50 p-2.5">
            <legend className="text-xs font-semibold text-nutri-ink px-1">Cinta métrica (cm)</legend>
            <div className="grid grid-cols-3 gap-2">
              {Campo({ id: `${idBase}-cintura`, texto: "Cintura", valor: medidas.cintura, onChange: cambiar("cintura"), placeholder: "Ej. 82" })}
              {Campo({ id: `${idBase}-cadera`, texto: "Cadera", valor: medidas.cadera, onChange: cambiar("cadera"), placeholder: "Ej. 100" })}
              {Campo({ id: `${idBase}-brazo`, texto: "Brazo", valor: medidas.brazo, onChange: cambiar("brazo"), placeholder: "Ej. 28" })}
            </div>
          </fieldset>

          <fieldset className="rounded-lg bg-gray-50 p-2.5">
            <legend className="text-xs font-semibold text-nutri-ink px-1">Pliegues cutáneos con plicómetro (mm)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLIEGUES.map(({ campo, nombre }) => Campo({
                id: `${idBase}-pliegue-${campo}`, texto: nombre, valor: medidas.pliegues[campo], onChange: cambiarPliegue(campo), placeholder: "mm",
              }))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">Con los 4 pliegues, la app calcula el % de grasa (Durnin-Womersley y Siri) con la edad y el sexo de la ficha.</p>
          </fieldset>

          <fieldset className="rounded-lg bg-gray-50 p-2.5">
            <legend className="text-xs font-semibold text-nutri-ink px-1">Balanza de bioimpedancia</legend>
            <div className="grid grid-cols-2 gap-2">
              {Campo({ id: `${idBase}-grasa`, texto: "% de grasa", valor: medidas.grasaPorcentaje, onChange: cambiar("grasaPorcentaje"), placeholder: "Ej. 30,5" })}
              {Campo({ id: `${idBase}-musculo`, texto: "Masa muscular (kg)", valor: medidas.masaMuscularKg, onChange: cambiar("masaMuscularKg"), placeholder: "Ej. 24,2" })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">Si llenas esto y también los pliegues, se usa el % de grasa de la balanza.</p>
          </fieldset>
        </div>
      )}
    </div>
  );
}

// ── Gráfico de evolución (una serie a la vez) ──
const SERIES = [
  { clave: "porcentajeGrasa", nombre: "% de grasa", unidad: "%", color: "#f59e0b" },
  { clave: "masaMuscularKg", nombre: "Músculo", unidad: "kg", color: "var(--color-nutri-brand)" },
  { clave: "masaMagraKg", nombre: "Masa magra", unidad: "kg", color: "#0ea5e9" },
  { clave: "cintura", nombre: "Cintura", unidad: "cm", color: "#8b5cf6" },
];

function GraficoEvolucion({ controles }) {
  const disponibles = SERIES.filter((s) => controles.filter((c) => c.composicion[s.clave] != null).length >= 1);
  const [clave, setClave] = useState(disponibles[0]?.clave);
  const serie = disponibles.find((s) => s.clave === clave) || disponibles[0];
  if (!serie) return null;
  const puntos = controles.filter((c) => c.composicion[serie.clave] != null).map((c) => ({ fecha: c.fecha, valor: Number(c.composicion[serie.clave]) }));
  const min = Math.min(...puntos.map((p) => p.valor)), max = Math.max(...puntos.map((p) => p.valor));
  const margen = Math.max((max - min) * 0.25, 1);
  const y = (v) => 110 - ((v - (min - margen)) / (max - min + 2 * margen)) * 95;
  const x = (i) => (puntos.length === 1 ? 160 : 24 + (i * 272) / (puntos.length - 1));
  const fecha = (f) => new Date(f).toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex flex-wrap gap-1.5 mb-2" role="tablist" aria-label="Medida del gráfico">
        {disponibles.map((s) => (
          <button key={s.clave} type="button" role="tab" aria-selected={s.clave === serie.clave} onClick={() => setClave(s.clave)}
            className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${s.clave === serie.clave ? "text-white border-transparent" : "border-line text-gray-500"}`}
            style={s.clave === serie.clave ? { background: s.color } : undefined}>
            {s.nombre}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 320 132" className="w-full h-36" role="img" aria-label={`Evolución de ${serie.nombre}`}>
        {puntos.length > 1 && (
          <polyline fill="none" stroke={serie.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
            points={puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ")} />
        )}
        {puntos.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.valor)} r="4.5" fill="#fff" stroke={serie.color} strokeWidth="2.5" />
            <text x={x(i)} y={y(p.valor) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">{formato(p.valor)}</text>
            <text x={x(i)} y="128" textAnchor="middle" fontSize="9" fill="#9ca3af">{fecha(p.fecha)}</text>
          </g>
        ))}
      </svg>
      {puntos.length === 1 && <p className="text-[11px] text-gray-500 text-center">Con el próximo control se verá la línea de avance.</p>}
    </div>
  );
}

// ── Barra del cuerpo: grasa / músculo / resto ──
function BarraCuerpo({ c }) {
  if (!c.peso || c.masaGrasaKg == null) return null;
  const grasa = c.masaGrasaKg;
  const musculo = c.masaMuscularKg != null ? Math.min(c.masaMuscularKg, c.peso - grasa) : null;
  const partes = musculo != null
    ? [
      { nombre: "Grasa", kg: grasa, color: "#f59e0b" },
      { nombre: "Músculo", kg: musculo, color: "var(--color-nutri-brand)" },
      { nombre: "Huesos, agua y órganos", kg: Math.max(c.peso - grasa - musculo, 0), color: "#94a3b8" },
    ]
    : [
      { nombre: "Grasa", kg: grasa, color: "#f59e0b" },
      { nombre: "Masa magra (músculo, huesos, agua)", kg: c.masaMagraKg, color: "var(--color-nutri-brand)" },
    ];
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-end gap-4">
        <svg viewBox="0 0 40 90" className="w-12 h-28 shrink-0" aria-hidden="true">
          <defs>
            <clipPath id="silueta">
              <circle cx="20" cy="10" r="8" />
              <path d="M8 22 Q20 18 32 22 L35 52 L30 52 L29 88 L22 88 L20 58 L18 88 L11 88 L10 52 L5 52 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#silueta)">
            {[...partes].reverse().map((p, i, lista) => {
              // Se apilan desde abajo: lo que va debajo de esta parte
              const debajo = lista.slice(0, i).reduce((t, q) => t + (q.kg / c.peso) * 90, 0);
              const alto = (p.kg / c.peso) * 90;
              return <rect key={p.nombre} x="0" y={90 - debajo - alto} width="40" height={alto} fill={p.color} />;
            })}
          </g>
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex h-4 rounded-full overflow-hidden">
            {partes.map((p) => <span key={p.nombre} style={{ width: `${(p.kg / c.peso) * 100}%`, background: p.color }} title={p.nombre} />)}
          </div>
          <ul className="mt-3 space-y-1.5">
            {partes.map((p) => (
              <li key={p.nombre} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-gray-600 flex-1 min-w-0">{p.nombre}</span>
                <strong className="text-nutri-ink tabular">{formato(p.kg)} kg</strong>
                <span className="text-xs text-gray-400 w-10 text-right tabular">{Math.round((p.kg / c.peso) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta semáforo ──
function Tarjeta({ icono: Icono, titulo, valor, unidad, evaluacion, cambio, mejorSiBaja, detalle, explicacion, paraPaciente }) {
  if (valor == null) return null;
  const s = semaforo(evaluacion);
  const sube = cambio != null && cambio > 0.05, baja = cambio != null && cambio < -0.05;
  const bueno = (mejorSiBaja && baja) || (!mejorSiBaja && sube);
  return (
    <div className="rounded-xl border border-line bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.fondo, color: s.color }}><Icono size={16} aria-hidden="true" /></span>
        <p className="text-xs font-semibold text-gray-500">{titulo}</p>
        {evaluacion && <span className="ml-auto text-[11px] font-bold rounded-full px-2 py-0.5" style={{ background: s.fondo, color: s.color }}>{s.texto}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-nutri-ink tabular">{formato(valor, unidad === "" ? 2 : 1)}<span className="text-sm text-gray-500 font-normal"> {unidad}</span></p>
      {(sube || baja) && (
        <p className="text-xs font-semibold mt-0.5 flex items-center gap-1" style={{ color: bueno ? "#16a34a" : "#d97706" }}>
          {baja ? <TrendingDown size={13} aria-hidden="true" /> : <TrendingUp size={13} aria-hidden="true" />}
          {baja ? "Bajó" : "Subió"} {formato(Math.abs(cambio))} {unidad} desde el control anterior{paraPaciente && bueno ? " ¡bien!" : ""}
        </p>
      )}
      {detalle && <p className="text-[11px] text-gray-500 mt-1">{detalle}</p>}
      {paraPaciente && explicacion && <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{explicacion}</p>}
    </div>
  );
}

// ── Panel completo: nutricionista ("Composición corporal") o paciente ("Mi cuerpo") ──
function PanelComposicion({ registros, paraPaciente = false }) {
  const controles = controlesConComposicion(registros);
  if (controles.length === 0) return null;
  const ultimo = controles.at(-1).composicion;
  const anterior = controles.length > 1 ? controles.at(-2).composicion : null;
  const cambio = (clave) => (anterior && ultimo[clave] != null && anterior[clave] != null ? ultimo[clave] - anterior[clave] : null);
  const fecha = new Date(controles.at(-1).fecha).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const rango = ultimo.rangoGrasa;

  return (
    <section className={paraPaciente ? "space-y-3" : "followup-overview space-y-3"} aria-label={paraPaciente ? "Mi cuerpo" : "Composición corporal"}>
      <div className="flex items-end justify-between gap-2">
        <div>
          {!paraPaciente && <span className="text-[10px] font-bold tracking-wider text-gray-500">MEDIDAS CORPORALES</span>}
          <h3 className="font-semibold text-lg text-nutri-ink leading-tight">{paraPaciente ? "Mi cuerpo" : "Composición corporal"}</h3>
          <p className="text-xs text-gray-500">Último control con medidas: {fecha}{!paraPaciente && ultimo.metodoGrasa ? ` · grasa por ${ultimo.metodoGrasa === "pliegues" ? "pliegues (Durnin-Womersley)" : "bioimpedancia"}` : ""}</p>
        </div>
        <small className="text-xs text-gray-500">{controles.length} {controles.length === 1 ? "control" : "controles"}</small>
      </div>

      {ultimo.faltaSexoOEdad && (
        <p className="text-xs rounded-lg bg-amber-50 text-amber-800 px-3 py-2">Para calcular el % de grasa con pliegues, completa la edad y el sexo (masculino o femenino) en la ficha del paciente.</p>
      )}

      <BarraCuerpo c={ultimo} />

      <div className="grid sm:grid-cols-2 gap-2.5">
        <Tarjeta icono={Activity} titulo={paraPaciente ? "Grasa corporal (reservas)" : "% de grasa corporal"} valor={ultimo.porcentajeGrasa} unidad="%" evaluacion={ultimo.evaluacion.grasa}
          cambio={cambio("porcentajeGrasa")} mejorSiBaja paraPaciente={paraPaciente} explicacion={EXPLICACION.grasa}
          detalle={rango ? `Rango saludable para la edad y el sexo: ${rango.desde}–${rango.hasta} %${ultimo.masaGrasaKg != null ? ` · ${formato(ultimo.masaGrasaKg)} kg de grasa` : ""}` : null} />
        <Tarjeta icono={Dumbbell} titulo={paraPaciente ? "Músculo" : "Masa muscular"} valor={ultimo.masaMuscularKg} unidad="kg"
          cambio={cambio("masaMuscularKg")} paraPaciente={paraPaciente} explicacion={EXPLICACION.musculo} />
        {ultimo.masaMuscularKg == null && (
          <Tarjeta icono={Dumbbell} titulo="Masa magra" valor={ultimo.masaMagraKg} unidad="kg"
            cambio={cambio("masaMagraKg")} paraPaciente={paraPaciente} explicacion={EXPLICACION.magra}
            detalle={!paraPaciente ? "Peso − masa grasa" : null} />
        )}
        <Tarjeta icono={Ruler} titulo="Cintura" valor={ultimo.cintura} unidad="cm" evaluacion={ultimo.evaluacion.cintura}
          cambio={cambio("cintura")} mejorSiBaja paraPaciente={paraPaciente} explicacion={EXPLICACION.cintura}
          detalle={!paraPaciente && ultimo.indiceCinturaCadera != null ? `Índice cintura/cadera: ${formato(ultimo.indiceCinturaCadera, 2)} (${semaforo(ultimo.evaluacion.indiceCinturaCadera).texto.toLowerCase()})` : null} />
        <Tarjeta icono={Scale} titulo="IMC" valor={ultimo.imc} unidad="kg/m²" evaluacion={ultimo.evaluacion.imc}
          cambio={cambio("imc")} mejorSiBaja={ultimo.evaluacion.imc !== "bajo"} paraPaciente={paraPaciente} explicacion={EXPLICACION.imc} />
        {!paraPaciente && ultimo.brazo != null && (
          <Tarjeta icono={Ruler} titulo="Circunferencia de brazo" valor={ultimo.brazo} unidad="cm" cambio={cambio("brazo")} />
        )}
      </div>

      <GraficoEvolucion controles={controles} />

      {paraPaciente && (
        <p className="text-[11px] text-gray-500 flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-0.5" aria-hidden="true" />Estas medidas las toma tu nutricionista en la consulta. Ella te ayuda a interpretarlas según tu objetivo.</p>
      )}
    </section>
  );
}

export default PanelComposicion;

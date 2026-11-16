import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CirclePlus, Flame, Search, Trash2, UtensilsCrossed } from "lucide-react";
import {
  buscarAlimentosDiario,
  eliminarIngestaPortal,
  listarIngestasPaciente,
  listarIngestasPortal,
  registrarIngestaPortal,
} from "../services/portalService";

function hoyLocal() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

const redondear = (numero) => Math.round((Number(numero) || 0) * 10) / 10;
const NUTRIENTES = {
  proteinas: ["Proteínas", "g"], carbohidratos: ["Carbohidratos", "g"],
  grasasTotales: ["Grasas", "g"], grasasSaturadas: ["Grasas saturadas", "g"],
  fibra: ["Fibra", "g"], azucares: ["Azúcares", "g"],
  sodio: ["Sodio", "mg"], potasio: ["Potasio", "mg"], calcio: ["Calcio", "mg"],
  hierro: ["Hierro", "mg"], magnesio: ["Magnesio", "mg"],
  vitaminaA: ["Vitamina A", "mcg"], vitaminaC: ["Vitamina C", "mg"],
  vitaminaD: ["Vitamina D", "mcg"], vitaminaB12: ["Vitamina B12", "mcg"],
};

function agruparPorDia(registros) {
  const dias = new Map();
  for (const registro of registros) {
    if (!dias.has(registro.fecha)) dias.set(registro.fecha, { fecha: registro.fecha, calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, registros: [] });
    const dia = dias.get(registro.fecha);
    dia.calorias += Number(registro.nutrientes?.calorias) || 0;
    dia.proteinas += Number(registro.nutrientes?.proteinas) || 0;
    dia.carbohidratos += Number(registro.nutrientes?.carbohidratos) || 0;
    dia.grasas += Number(registro.nutrientes?.grasasTotales) || 0;
    dia.registros.push(registro);
  }
  return [...dias.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function TendenciaCalorias({ dias }) {
  const ordenados = [...dias].reverse().slice(-8);
  if (ordenados.length < 2) return null;
  const max = Math.max(...ordenados.map((dia) => dia.calorias), 1);
  const puntos = ordenados.map((dia, i) => `${14 + i * 272 / (ordenados.length - 1)},${76 - dia.calorias / max * 54}`).join(" ");
  return (
    <div className="food-diary-trend">
      <div><strong>Calorías registradas</strong><span>Últimos {ordenados.length} días con alimentos</span></div>
      <svg viewBox="0 0 300 86" role="img" aria-label={`Calorías registradas por día: ${ordenados.map((d) => `${d.fecha}: ${Math.round(d.calorias)} kcal`).join(", ")}`}>
        <line x1="14" x2="286" y1="76" y2="76" stroke="#d6eee2" />
        <polyline points={puntos} fill="none" stroke="#13b57b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {ordenados.map((dia, i) => <circle key={dia.fecha} cx={14 + i * 272 / (ordenados.length - 1)} cy={76 - dia.calorias / max * 54} r="4" fill="#fff" stroke="#0c9a6a" strokeWidth="2" />)}
      </svg>
    </div>
  );
}

function FilaAlimento({ registro, esPaciente, onEliminar }) {
  const nutrientes = Object.entries(NUTRIENTES).filter(([clave]) => Number.isFinite(Number(registro.nutrientes?.[clave])) && registro.nutrientes?.[clave] != null);
  return <li className="food-diary-entry">
    <span>{registro.nombreAlimento}<small>{registro.cantidad} {registro.unidad} · {registro.fuente}</small></span>
    <strong>{Math.round(Number(registro.nutrientes?.calorias) || 0)} kcal</strong>
    {esPaciente && <button type="button" onClick={() => onEliminar(registro.id)} aria-label={`Quitar ${registro.nombreAlimento}`}><Trash2 size={15} aria-hidden="true" /></button>}
    {nutrientes.length > 0 && <details className="food-diary-nutrients"><summary>Ver nutrientes calculados</summary><div>{nutrientes.map(([clave, [nombre, unidad]]) => <span key={clave}>{nombre} <b>{redondear(registro.nutrientes[clave])} {unidad}</b></span>)}</div></details>}
  </li>;
}

function DiarioAlimentario({ idPaciente }) {
  const esPaciente = !idPaciente;
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState(hoyLocal);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [consultaSugerida, setConsultaSugerida] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [cantidad, setCantidad] = useState("100");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    const cargar = esPaciente ? listarIngestasPortal : () => listarIngestasPaciente(idPaciente);
    cargar().then((datos) => { if (vigente) setRegistros(datos); })
      .catch((err) => { if (vigente) setError(err.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [esPaciente, idPaciente]);

  useEffect(() => {
    if (!esPaciente || seleccion || busqueda.trim().length < 2) return;
    let vigente = true;
    const consulta = busqueda.trim();
    const timer = setTimeout(() => {
      buscarAlimentosDiario(consulta)
        .then((datos) => { if (vigente) { setSugerencias(datos); setConsultaSugerida(consulta); } })
        .catch((err) => { if (vigente) setError(err.message); });
    }, 250);
    return () => { vigente = false; clearTimeout(timer); };
  }, [busqueda, seleccion, esPaciente]);

  const dias = useMemo(() => agruparPorDia(registros), [registros]);
  const estimacion = seleccion?.caloriasPor100 == null ? null : redondear(seleccion.caloriasPor100 * Number(cantidad) / 100);

  async function registrar(evento) {
    evento.preventDefault();
    if (!seleccion) return;
    setGuardando(true);
    setError("");
    try {
      const nuevo = await registrarIngestaPortal({ idReferencia: seleccion.id, fecha, cantidad: Number(cantidad) });
      setRegistros((actuales) => [nuevo, ...actuales]);
      setBusqueda("");
      setSeleccion(null);
      setCantidad("100");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!window.confirm("¿Quitar este alimento del diario?")) return;
    try {
      await eliminarIngestaPortal(id);
      setRegistros((actuales) => actuales.filter((registro) => registro.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className={`food-diary ${esPaciente ? "food-diary-patient" : "food-diary-clinician"}`}>
      <div className="food-diary-heading"><span className="food-diary-icon"><UtensilsCrossed size={19} aria-hidden="true" /></span><div><h2>{esPaciente ? "Mi diario de alimentos" : "Alimentos registrados por el paciente"}</h2><p>{esPaciente ? "Anota lo que realmente comiste. La tabla nutricional calcula el aporte estimado." : "Compara la ingesta registrada con el peso y el seguimiento; los días sin registros no representan ayuno."}</p></div></div>

      {esPaciente && <form className="food-diary-form" onSubmit={registrar}>
        <label><CalendarDays size={14} aria-hidden="true" /> Fecha<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></label>
        <div className="food-diary-search"><label htmlFor="diary-food"><Search size={14} aria-hidden="true" /> Alimento</label><input id="diary-food" type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setSeleccion(null); }} placeholder="Busca arroz, lentejas, banano..." autoComplete="off" required />
          {!seleccion && consultaSugerida === busqueda.trim() && sugerencias.length > 0 && <div className="food-diary-suggestions" role="listbox" aria-label="Alimentos de la tabla USFQ">{sugerencias.map((alimento) => <button key={alimento.id} type="button" role="option" aria-selected="false" onClick={() => { setSeleccion(alimento); setBusqueda(alimento.nombre); }}><span>{alimento.nombre}</span><small>{alimento.caloriasPor100 == null ? "Sin energía" : `${redondear(alimento.caloriasPor100)} kcal / 100 ${alimento.unidad}`}</small></button>)}</div>}
        </div>
        <label>Cantidad ({seleccion?.unidad || "g o ml"})<input type="number" min="0.01" max="2000" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required /></label>
        <div className="food-diary-submit"><span>{estimacion == null ? "Selecciona un alimento de la lista" : `≈ ${estimacion} kcal`}</span><button type="submit" disabled={!seleccion || guardando}><CirclePlus size={16} aria-hidden="true" />{guardando ? "Guardando..." : "Registrar"}</button></div>
      </form>}

      {error && <p className="food-diary-error" role="alert">{error}</p>}
      {cargando ? <p className="food-diary-empty">Cargando diario...</p> : dias.length === 0 ? <p className="food-diary-empty">{esPaciente ? "Aún no registras alimentos. Busca uno arriba para comenzar." : "El paciente aún no registra alimentos en su app."}</p> : <>
        {!esPaciente && <TendenciaCalorias dias={dias} />}
        <div className="food-diary-days">{dias.slice(0, 14).map((dia) =>
          <article key={dia.fecha} className="food-diary-day">
            <div className="food-diary-day-head"><strong>{new Date(`${dia.fecha}T12:00:00`).toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })}</strong><span><Flame size={14} aria-hidden="true" /> {Math.round(dia.calorias)} kcal registradas</span></div>
            <p className="food-diary-macros">Proteínas {redondear(dia.proteinas)} g · Carbohidratos {redondear(dia.carbohidratos)} g · Grasas {redondear(dia.grasas)} g</p>
            <ul>{dia.registros.map((registro) => <FilaAlimento key={registro.id} registro={registro} esPaciente={esPaciente} onEliminar={eliminar} />)}</ul>
          </article>)}</div>
      </>}
      <p className="food-diary-note">Valores estimados según tabla USFQ y la cantidad indicada. Si faltan comidas o días por registrar, las calorías mostradas no representan la ingesta total.</p>
    </section>
  );
}

export default DiarioAlimentario;

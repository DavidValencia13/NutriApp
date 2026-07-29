import { useState, useEffect } from "react";
import {
  listarConsultas,
  registrarConsulta,
  eliminarConsulta,
} from "../services/consultaService";
import { listarHistorialMenus } from "../services/menuService";
import { IconTrash } from "./Icons";

// Heurística de dirección del objetivo (mismo criterio que ya usa el
// backend para alertas, ver Alerta/Dominio/Servicios/EvaluadorAlertas.js)
// reimplementada acá en JS plano: es una comparación de solo lectura sobre
// datos ya cargados, no amerita una llamada al backend.
function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function direccionObjetivo(objetivo) {
  const t = normalizar(objetivo);
  if (t.includes("bajar") || t.includes("perder") || t.includes("reducir") || t.includes("adelgazar"))
    return -1;
  if (t.includes("subir") || t.includes("aumentar") || t.includes("ganar") || t.includes("engordar"))
    return 1;
  return 0;
}

function calcularIMC(peso, altura) {
  if (!peso || !altura) return undefined;
  return peso / (altura * altura);
}

function definedDelta(a, b) {
  if (a === undefined || a === null || b === undefined || b === null) return undefined;
  return b - a;
}

// Una línea por métrica (small multiples): peso/IMC/%grasa/masa muscular
// tienen escalas muy distintas, así que cada una va en su propia gráfica en
// vez de compartir un solo eje (evita el error clásico de doble eje).
const METRICAS = [
  { key: "peso", label: "Peso", unidad: "kg", color: "#1ba9a0" },
  { key: "imc", label: "IMC", unidad: "", color: "#2e86c1", derivada: true },
  { key: "porcentajeGrasaCorporal", label: "% Grasa corporal", unidad: "%", color: "#f5a623" },
  { key: "masaMuscular", label: "Masa muscular", unidad: "kg", color: "#4caf7d" },
];

const CAMPOS_MEDIDAS = [
  ["cintura", "Cintura"],
  ["cadera", "Cadera"],
  ["brazo", "Brazo"],
  ["muslo", "Muslo"],
  ["pecho", "Pecho"],
  ["cuello", "Cuello"],
];

function HistorialPaciente({ paciente }) {
  const idPaciente = paciente.id;
  const [consultas, setConsultas] = useState([]);
  const [menus, setMenus] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [consultaAId, setConsultaAId] = useState(null);
  const [consultaBId, setConsultaBId] = useState(null);

  useEffect(() => {
    cargar();
  }, [idPaciente]);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const [consultasData, menusData] = await Promise.all([
        listarConsultas(idPaciente),
        listarHistorialMenus(idPaciente),
      ]);
      setConsultas(consultasData);
      setMenus(menusData);
      if (consultasData.length > 0) {
        setConsultaAId((prev) => prev ?? consultasData[0].id);
        setConsultaBId((prev) => prev ?? consultasData[consultasData.length - 1].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminarConsulta(id) {
    if (!confirm("¿Seguro que deseas eliminar esta consulta?")) return;
    try {
      await eliminarConsulta(idPaciente, id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSuccessFormulario() {
    setMostrarFormulario(false);
    cargar();
  }

  if (cargando) return <p>Cargando historial...</p>;

  // Cada consulta trae su IMC calculado con la altura actual del paciente
  // (la altura no se versiona por consulta, se asume estable en el tiempo).
  const puntos = consultas.map((c) => ({ ...c, imc: calcularIMC(c.peso, paciente.altura) }));
  const imcActual = calcularIMC(paciente.peso, paciente.altura);

  return (
    <div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatTile label="Peso inicial" valor={`${paciente.pesoInicial ?? "—"} kg`} />
        <StatTile label="Peso actual" valor={`${paciente.peso} kg`} />
        <StatTile label="IMC actual" valor={imcActual ? imcActual.toFixed(1) : "—"} />
        <StatTile label="Objetivo" valor={paciente.objetivo} />
      </div>

      {(paciente.alergias?.length > 0 || paciente.enfermedades?.length > 0 || paciente.restricciones) && (
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          {paciente.alergias?.length > 0 && (
            <span className="bg-nutri-pink/10 text-nutri-pink px-2 py-1 rounded-full">
              Alergias: {paciente.alergias.join(", ")}
            </span>
          )}
          {paciente.enfermedades?.length > 0 && (
            <span className="bg-nutri-orange/10 text-nutri-orange px-2 py-1 rounded-full">
              Enfermedades: {paciente.enfermedades.join(", ")}
            </span>
          )}
          {paciente.restricciones && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              Restricciones: {paciente.restricciones}
            </span>
          )}
        </div>
      )}

      {puntos.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">
          Todavía no hay consultas registradas para graficar la evolución.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {METRICAS.map((m) => (
            <GraficaEvolucion key={m.key} metrica={m} puntos={puntos} />
          ))}
        </div>
      )}

      {puntos.length >= 2 && (
        <ComparacionPeriodos
          puntos={puntos}
          consultaAId={consultaAId}
          consultaBId={consultaBId}
          setConsultaAId={setConsultaAId}
          setConsultaBId={setConsultaBId}
          objetivo={paciente.objetivo}
        />
      )}

      <div className="mb-4">
        <button
          onClick={() => setMostrarFormulario((v) => !v)}
          className="text-sm text-nutri-teal hover:underline"
        >
          {mostrarFormulario ? "− Cancelar" : "+ Registrar nueva consulta"}
        </button>
        {mostrarFormulario && (
          <FormularioConsulta
            idPaciente={idPaciente}
            onSuccess={handleSuccessFormulario}
            onCancel={() => setMostrarFormulario(false)}
          />
        )}
      </div>

      <div className="mb-4">
        <p className="font-semibold text-nutri-navy mb-2 text-sm">
          Consultas registradas ({puntos.length})
        </p>
        {puntos.length === 0 ? (
          <p className="text-gray-500 text-xs">Ninguna todavía.</p>
        ) : (
          <div className="grid gap-1.5">
            {[...puntos].reverse().map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-nutri-navy">
                    {new Date(c.fecha).toLocaleDateString()} — {c.peso} kg
                    {c.imc ? ` · IMC ${c.imc.toFixed(1)}` : ""}
                    {c.porcentajeGrasaCorporal ? ` · ${c.porcentajeGrasaCorporal}% grasa` : ""}
                    {c.masaMuscular ? ` · ${c.masaMuscular}kg músculo` : ""}
                  </p>
                  {c.observaciones && (
                    <p className="text-gray-500 mt-0.5">Obs: {c.observaciones}</p>
                  )}
                  {c.resultados && (
                    <p className="text-gray-500 mt-0.5">Resultados: {c.resultados}</p>
                  )}
                </div>
                <button
                  onClick={() => handleEliminarConsulta(c.id)}
                  className="text-nutri-pink hover:opacity-70 shrink-0"
                  aria-label="Eliminar consulta"
                >
                  <IconTrash width="14" height="14" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="font-semibold text-nutri-navy mb-2 text-sm">Dietas anteriores</p>
        {menus.length === 0 ? (
          <p className="text-gray-500 text-xs">Ningún menú generado todavía.</p>
        ) : (
          <div className="grid gap-1.5">
            {menus.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <span className="text-nutri-navy">
                  {new Date(m.fechaGeneracion).toLocaleDateString()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    m.estado === "aprobado" ? "bg-nutri-green/15 text-nutri-green" : "bg-nutri-orange/15 text-nutri-orange"
                  }`}
                >
                  {m.estado === "aprobado" ? "Aprobado" : "Generado"}
                </span>
                <span className="text-gray-500">
                  {Math.round(m.caloriasTotalesSemana / 7)} kcal/día · {m.costoTotalSemana.toFixed(2)}$
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, valor }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2 px-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-nutri-navy truncate">{valor}</p>
    </div>
  );
}

function GraficaEvolucion({ metrica, puntos }) {
  const [hover, setHover] = useState(null);

  const valores = puntos
    .map((p) => ({ fecha: p.fecha, valor: metrica.derivada ? p.imc : p[metrica.key] }))
    .filter((p) => Number.isFinite(p.valor));

  // Sin datos para esta métrica en ninguna consulta: no se muestra la
  // gráfica vacía (mejor nada que una caja en blanco sin información).
  if (valores.length === 0) return null;

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
        <p className="text-xs font-semibold text-nutri-navy">{metrica.label}</p>
        {delta !== undefined && (
          <span className={`text-[11px] font-medium ${Math.abs(delta) < 0.05 ? "text-gray-400" : "text-nutri-navy"}`}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} {metrica.unidad}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Evolución de ${metrica.label}: ${valores.map((v) => v.valor.toFixed(1)).join(", ")}`}
      >
        <line x1={padX} y1={y(min)} x2={w - padX} y2={y(min)} stroke="#e5e7eb" strokeWidth="1" />
        {max !== min && (
          <line x1={padX} y1={y(max)} x2={w - padX} y2={y(max)} stroke="#e5e7eb" strokeWidth="1" />
        )}
        {valores.length > 1 && (
          <polyline
            points={puntosPath}
            fill="none"
            stroke={metrica.color}
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
            fill={metrica.color}
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
          fill={metrica.color}
          fontWeight="600"
        >
          {ultimo.valor.toFixed(1)}
          {metrica.unidad}
        </text>
      </svg>
      <p className="text-[10px] text-gray-400 text-center h-3">
        {hover !== null &&
          `${new Date(valores[hover].fecha).toLocaleDateString()}: ${valores[hover].valor.toFixed(1)} ${metrica.unidad}`}
      </p>
    </div>
  );
}

function ComparacionPeriodos({ puntos, consultaAId, consultaBId, setConsultaAId, setConsultaBId, objetivo }) {
  const a = puntos.find((p) => p.id === consultaAId) || puntos[0];
  const b = puntos.find((p) => p.id === consultaBId) || puntos[puntos.length - 1];

  const deltaPeso = b.peso - a.peso;
  const direccion = direccionObjetivo(objetivo); // -1 bajar, 1 subir, 0 mantener
  const TOLERANCIA_KG = 0.3; // evita "retrocediendo" por ruido de +-300g

  let verdict;
  if (direccion === -1) {
    verdict = deltaPeso < -TOLERANCIA_KG ? "Mejorando" : deltaPeso > TOLERANCIA_KG ? "Retrocediendo" : "Manteniéndose";
  } else if (direccion === 1) {
    verdict = deltaPeso > TOLERANCIA_KG ? "Mejorando" : deltaPeso < -TOLERANCIA_KG ? "Retrocediendo" : "Manteniéndose";
  } else {
    verdict = Math.abs(deltaPeso) <= TOLERANCIA_KG ? "Manteniéndose" : "Cambio notable — revisar con el paciente";
  }
  const verdictClase =
    verdict === "Mejorando"
      ? "bg-nutri-green/15 text-nutri-green"
      : verdict === "Retrocediendo"
        ? "bg-nutri-pink/15 text-nutri-pink"
        : "bg-gray-200 text-gray-600";

  return (
    <div className="rounded-lg p-3 mb-4 border border-gray-200 bg-gray-50">
      <p className="text-sm font-semibold text-nutri-navy mb-2">Comparar periodos</p>
      <div className="flex flex-wrap gap-2 items-center mb-3 text-xs">
        <select
          value={consultaAId ?? ""}
          onChange={(e) => setConsultaAId(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1"
        >
          {puntos.map((p) => (
            <option key={p.id} value={p.id}>
              {new Date(p.fecha).toLocaleDateString()}
            </option>
          ))}
        </select>
        <span className="text-gray-400">vs</span>
        <select
          value={consultaBId ?? ""}
          onChange={(e) => setConsultaBId(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1"
        >
          {puntos.map((p) => (
            <option key={p.id} value={p.id}>
              {new Date(p.fecha).toLocaleDateString()}
            </option>
          ))}
        </select>
        <span className={`ml-auto px-2 py-1 rounded-full font-medium ${verdictClase}`}>{verdict}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <DeltaTile label="Peso" delta={deltaPeso} unidad="kg" />
        <DeltaTile label="IMC" delta={definedDelta(a.imc, b.imc)} unidad="" />
        <DeltaTile label="% Grasa" delta={definedDelta(a.porcentajeGrasaCorporal, b.porcentajeGrasaCorporal)} unidad="%" />
        <DeltaTile label="Masa muscular" delta={definedDelta(a.masaMuscular, b.masaMuscular)} unidad="kg" />
      </div>
    </div>
  );
}

function DeltaTile({ label, delta, unidad }) {
  return (
    <div className="bg-white rounded-lg py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-nutri-navy">
        {delta === undefined ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${unidad}`}
      </p>
    </div>
  );
}

function FormularioConsulta({ idPaciente, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    peso: "",
    porcentajeGrasaCorporal: "",
    masaMuscular: "",
    cintura: "",
    cadera: "",
    brazo: "",
    muslo: "",
    pecho: "",
    cuello: "",
    observaciones: "",
    resultados: "",
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
      const medidas = {};
      for (const [campo] of CAMPOS_MEDIDAS) {
        if (form[campo] !== "") medidas[campo] = parseFloat(form[campo]);
      }
      const datos = {
        peso: parseFloat(form.peso),
        porcentajeGrasaCorporal: form.porcentajeGrasaCorporal === "" ? undefined : parseFloat(form.porcentajeGrasaCorporal),
        masaMuscular: form.masaMuscular === "" ? undefined : parseFloat(form.masaMuscular),
        medidas: Object.keys(medidas).length > 0 ? medidas : undefined,
        observaciones: form.observaciones || undefined,
        resultados: form.resultados || undefined,
      };
      await registrarConsulta(idPaciente, datos);
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
          <label className={labelClass}>Peso (kg) *</label>
          <input type="number" step="any" min="0" name="peso" value={form.peso} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>% Grasa corporal</label>
          <input type="number" step="any" min="0" max="100" name="porcentajeGrasaCorporal" value={form.porcentajeGrasaCorporal} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Masa muscular (kg)</label>
          <input type="number" step="any" min="0" name="masaMuscular" value={form.masaMuscular} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <p className="text-xs font-medium text-gray-500 mb-1">Medidas corporales (cm, opcional)</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
        {CAMPOS_MEDIDAS.map(([campo, label]) => (
          <div key={campo}>
            <label className={labelClass}>{label}</label>
            <input type="number" step="any" min="0" name={campo} value={form[campo]} onChange={handleChange} className={inputClass} />
          </div>
        ))}
      </div>

      <div className="mb-2">
        <label className={labelClass}>Observaciones</label>
        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} className={inputClass} />
      </div>
      <div className="mb-3">
        <label className={labelClass}>Resultados obtenidos</label>
        <textarea name="resultados" value={form.resultados} onChange={handleChange} rows={2} className={inputClass} />
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

export default HistorialPaciente;

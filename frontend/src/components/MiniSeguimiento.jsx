import { useEffect, useRef, useState } from "react";
import { listarSeguimiento } from "../services/seguimientoService";
import { ordenarControles } from "../utils/ordenarControles";
import PesoTrendChart from "./PesoTrendChart";
import { Activity, CalendarDays, CheckCircle2, Scale, Target, TrendingUp } from "lucide-react";

function puntosPeso(registros) {
  return (Array.isArray(registros) ? registros : [])
    .filter((registro) => Number.isFinite(Number(registro.peso)) && Number(registro.peso) > 0)
    .sort(ordenarControles);
}

// Nivel de cada indicador -> texto y color (verde = bien, ámbar = vigilar, rojo = alto)
const NIVELES = {
  bueno: { texto: "Bueno", tono: "bien" }, alto: { texto: "Alto", tono: "alerta" }, bajo: { texto: "Bajo", tono: "vigilar" },
  saludable: { texto: "Saludable", tono: "bien" }, sobrepeso: { texto: "Sobrepeso", tono: "vigilar" }, obesidad: { texto: "Obesidad", tono: "alerta" },
  muy_alto: { texto: "Muy alto", tono: "alerta" }, aumentado: { texto: "Aumentado", tono: "vigilar" },
};

// En músculo, "alto" es bueno (ej. deportistas)
const NIVELES_MUSCULO = { bajo: { texto: "Bajo", tono: "vigilar" }, bueno: { texto: "Bueno", tono: "bien" }, alto: { texto: "Alto", tono: "bien" } };

function MiniSeguimiento({ idPaciente, version, pesoFicha, nivelActividad, objetivo, altura }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [registros, setRegistros] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    if (!window.IntersectionObserver) {
      queueMicrotask(() => setVisible(true));
      return undefined;
    }
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) { setVisible(true); observador.disconnect(); }
    }, { rootMargin: "100px" });
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let vigente = true;
    listarSeguimiento(idPaciente).then((datos) => {
      if (vigente) { setRegistros(datos); setError(false); }
    }).catch(() => { if (vigente) { setRegistros(null); setError(true); } });
    return () => { vigente = false; };
  }, [idPaciente, version, visible]);

  const todosLosPesos = puntosPeso(registros);
  const primero = todosLosPesos[0];
  const ultimo = todosLosPesos.at(-1);
  const diasConPeso = new Set(todosLosPesos.map((r) => new Date(r.fecha).toISOString().slice(0, 10))).size;
  const mismoDia = todosLosPesos.length >= 2 && diasConPeso === 1;
  const delta = todosLosPesos.length >= 2 ? Number(ultimo.peso) - Number(primero.peso) : null;
  const pesoTexto = (valor) => Number(valor).toFixed(1).replace(".", ",");
  const fechaTexto = (valor) => new Date(valor).toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "UTC" });
  const porcentaje = delta !== null ? delta / Number(primero.peso) * 100 : null;
  const pesoMostrado = ultimo?.peso ?? pesoFicha;
  const cumplimiento = { bien: "Buena", regular: "Parcial", mal: "Baja" }[ultimo?.nivelCumplimiento];
  // Composición corporal del último control con medidas (para quien el peso
  // y el IMC no bastan, ej. deportistas)
  const comp = [...(Array.isArray(registros) ? registros : [])].filter((r) => r.composicion).sort(ordenarControles).at(-1)?.composicion;
  const tallaM = Number(altura) > 0 ? Number(altura) : null;
  const imc = comp?.imc ?? (pesoMostrado && tallaM ? Math.round((Number(pesoMostrado) / (tallaM * tallaM)) * 10) / 10 : null);
  const estadoImc = comp?.evaluacion?.imc ?? (imc == null ? null : imc < 18.5 ? "bajo" : imc < 25 ? "saludable" : imc < 30 ? "sobrepeso" : "obesidad");
  const cuerpo = [
    { clave: "imc", titulo: "IMC", valor: imc != null ? String(imc).replace(".", ",") : null, nivel: estadoImc },
    { clave: "musculo", titulo: "Músculo", valor: comp?.masaMuscularKg != null ? `${String(comp.masaMuscularKg).replace(".", ",")} kg` : comp?.masaMagraKg != null ? `${String(comp.masaMagraKg).replace(".", ",")} kg magra` : null, nivel: comp?.evaluacion?.musculo?.nivel },
    { clave: "grasa", titulo: "Grasa", valor: comp?.porcentajeGrasa != null ? `${String(comp.porcentajeGrasa).replace(".", ",")} %` : null, nivel: comp?.evaluacion?.grasa },
    { clave: "cintura", titulo: "Cintura", valor: comp?.cintura != null ? `${String(comp.cintura).replace(".", ",")} cm` : null, nivel: comp?.evaluacion?.cintura },
  ];
  return (
    <div ref={ref} className="patient-trend" aria-label="Resumen de seguimiento del paciente">
      <div className="patient-vitals">
        <div className="patient-vital patient-vital-weight"><span className="patient-vital-icon"><Scale size={19} aria-hidden="true" /></span><div><span>{ultimo ? "Peso actual" : "Peso de ficha"}</span><strong>{pesoMostrado ? `${pesoTexto(pesoMostrado)} kg` : "Sin registrar"}</strong></div></div>
        <div className="patient-vital patient-vital-goal"><span className="patient-vital-icon"><Target size={19} aria-hidden="true" /></span><div><span>Objetivo</span><strong>{objetivo || "Sin definir"}</strong></div></div>
        <div className="patient-vital patient-vital-activity"><span className="patient-vital-icon"><Activity size={19} aria-hidden="true" /></span><div><span>Actividad</span><strong>{nivelActividad || "Sin registrar"}</strong></div></div>
      </div>
      <div className="patient-body" aria-label="Composición corporal">
        {cuerpo.map((c) => {
          const n = (c.clave === "musculo" ? NIVELES_MUSCULO : NIVELES)[c.nivel];
          return (
            <div key={c.clave} className={`patient-body-item ${n ? `nivel-${n.tono}` : ""}`}>
              <span>{c.titulo}</span>
              <strong>{n ? n.texto : c.valor ? "—" : "Sin dato"}</strong>
              <small>{c.valor || (c.clave === "imc" ? "Falta peso o talla" : "Medir en Seguimiento")}</small>
            </div>
          );
        })}
      </div>
      <div className="patient-trend-detail">
        <div className="patient-trend-copy">
          <span className="patient-trend-kicker"><TrendingUp size={15} aria-hidden="true" />{mismoDia ? "Cambio entre controles" : "Progreso de peso"}</span>
          {delta !== null ? <>
            <div className="patient-trend-change"><strong className="patient-trend-result" aria-label={`Cambio desde el primer control: ${pesoTexto(delta)} kilogramos`}>{delta > 0 ? "+" : ""}{pesoTexto(delta)} kg</strong><span className="patient-trend-percent">{porcentaje < 0 ? "↓ " : porcentaje > 0 ? "↑ +" : ""}{pesoTexto(porcentaje)} %</span></div>
            <p className="patient-trend-comparison">Inicial: <b>{pesoTexto(primero.peso)} kg</b><span aria-hidden="true"> | </span>Actual: <b>{pesoTexto(ultimo.peso)} kg</b></p>
            <div className="patient-trend-meta"><span><CalendarDays size={13} aria-hidden="true" />{mismoDia ? `${todosLosPesos.length} controles el ${fechaTexto(ultimo.fecha)}` : `${fechaTexto(primero.fecha)} – ${fechaTexto(ultimo.fecha)}`}</span>{cumplimiento && <span className={`patient-trend-adherence patient-trend-adherence--${ultimo.nivelCumplimiento}`}><CheckCircle2 size={13} aria-hidden="true" />Cumplimiento: {cumplimiento}</span>}</div>
          </> : <div className="patient-trend-no-data"><strong>{error ? "Seguimiento no disponible" : registros === null ? "Cargando controles…" : ultimo ? "Primer peso registrado" : "Aún no hay controles de peso"}</strong><span>{ultimo ? "El punto ya aparece; registra un peso en otra fecha para ver la tendencia." : "Registra un peso para iniciar la gráfica."}</span></div>}
        </div>
        {ultimo ? <PesoTrendChart registros={todosLosPesos} id={`mini-${idPaciente}`} compacto /> : <div className="patient-trend-pending"><TrendingUp size={29} aria-hidden="true" /><span>La gráfica aparecerá al registrar el primer peso.</span></div>}
      </div>
    </div>
  );
}

export default MiniSeguimiento;

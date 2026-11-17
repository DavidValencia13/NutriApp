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

function MiniSeguimiento({ idPaciente, version, pesoFicha, nivelActividad, objetivo }) {
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
  return (
    <div ref={ref} className="patient-trend" aria-label="Resumen de seguimiento del paciente">
      <div className="patient-vitals">
        <div className="patient-vital patient-vital-weight"><span className="patient-vital-icon"><Scale size={19} aria-hidden="true" /></span><div><span>{ultimo ? "Peso actual" : "Peso de ficha"}</span><strong>{pesoMostrado ? `${pesoTexto(pesoMostrado)} kg` : "Sin registrar"}</strong></div></div>
        <div className="patient-vital patient-vital-goal"><span className="patient-vital-icon"><Target size={19} aria-hidden="true" /></span><div><span>Objetivo</span><strong>{objetivo || "Sin definir"}</strong></div></div>
        <div className="patient-vital patient-vital-activity"><span className="patient-vital-icon"><Activity size={19} aria-hidden="true" /></span><div><span>Actividad</span><strong>{nivelActividad || "Sin registrar"}</strong></div></div>
      </div>
      <div className="patient-trend-detail">
        <div className="patient-trend-copy">
          <span className="patient-trend-kicker"><TrendingUp size={15} aria-hidden="true" />{mismoDia ? "Cambio entre controles" : "Progreso de peso"}</span>
          {delta !== null ? <>
            <div className="patient-trend-change"><strong className="patient-trend-result" aria-label={`Cambio desde el primer control: ${pesoTexto(delta)} kilogramos`}>{delta > 0 ? "+" : ""}{pesoTexto(delta)} kg</strong><span className="patient-trend-percent">{porcentaje < 0 ? "↓ " : porcentaje > 0 ? "↑ +" : ""}{pesoTexto(porcentaje)} %</span></div>
            <p className="patient-trend-comparison">Inicial: <b>{pesoTexto(primero.peso)} kg</b><span aria-hidden="true"> | </span>Actual: <b>{pesoTexto(ultimo.peso)} kg</b></p>
            <div className="patient-trend-meta"><span><CalendarDays size={13} aria-hidden="true" />{mismoDia ? `${todosLosPesos.length} controles el ${fechaTexto(ultimo.fecha)}` : `${fechaTexto(primero.fecha)} – ${fechaTexto(ultimo.fecha)}`}</span>{cumplimiento && <span className={`patient-trend-adherence patient-trend-adherence--${ultimo.nivelCumplimiento}`}><CheckCircle2 size={13} aria-hidden="true" />Cumplimiento: {cumplimiento}</span>}</div>
          </> : <div className="patient-trend-no-data"><strong>{error ? "Seguimiento no disponible" : registros === null ? "Cargando controles…" : "Aún no hay cambio entre controles"}</strong><span>{ultimo ? "Registra otro control de peso para compararlos." : "Registra controles para ver cómo evoluciona el peso."}</span></div>}
        </div>
        {delta !== null && <PesoTrendChart registros={todosLosPesos} id={`mini-${idPaciente}`} compacto />}
        {delta === null && <div className="patient-trend-pending"><TrendingUp size={29} aria-hidden="true" /><span>La gráfica aparecerá con pesos en dos fechas distintas.</span></div>}
      </div>
    </div>
  );
}

export default MiniSeguimiento;

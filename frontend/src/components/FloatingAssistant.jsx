import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import AsistenteChat from "./AsistenteChat";
import avatar from "../assets/nutrition-assistant.webp";

const AVATAR_SIZE = 98;
const EDGE = 14;
const STORAGE_KEY = "nutriapp-assistant-position-v4";

function clampPosition(position, viewport) {
  return {
    x: Math.max(EDGE, Math.min(position.x, viewport.width - AVATAR_SIZE - EDGE)),
    y: Math.max(EDGE, Math.min(position.y, viewport.height - AVATAR_SIZE - EDGE)),
  };
}

function defaultPosition(viewport) {
  return clampPosition(viewport.width > 760
    ? { x: 74, y: viewport.height - 157 }
    : { x: viewport.width - 110, y: viewport.height - 118 }, viewport);
}

function initialPosition() {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
      return clampPosition(saved, viewport);
    }
  } catch {
    // La posición guardada es opcional.
  }
  return defaultPosition(viewport);
}

const statusLabels = {
  idle: "Listo para ayudarte",
  reading: "Leyendo tu consulta…",
  thinking: "Preparando respuesta…",
  ready: "Respuesta lista",
  error: "Revisa la conexión",
};

function FloatingAssistant({ pacientes, hidden = false, onAbrirMenu }) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [position, setPosition] = useState(initialPosition);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("idle");
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const previousViewport = useRef({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    function handleResize() {
      const nextViewport = { width: window.innerWidth, height: window.innerHeight };
      const changedLayout = (previousViewport.current.width > 760) !== (nextViewport.width > 760);
      previousViewport.current = nextViewport;
      setViewport(nextViewport);
      setPosition((current) => changedLayout ? defaultPosition(nextViewport) : clampPosition(current, nextViewport));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const selectedPatient = pacientes.find((p) => String(p.id) === selectedId) || null;
  const panelWidth = Math.min(400, viewport.width - 24);
  const panelHeight = Math.min(610, viewport.height - 24);
  const panelLeft = Math.max(12, Math.min(
    position.x > viewport.width / 2 ? position.x - panelWidth + AVATAR_SIZE : position.x + AVATAR_SIZE + 10,
    viewport.width - panelWidth - 12,
  ));
  const panelTop = Math.max(12, Math.min(
    position.y > viewport.height / 2 ? position.y - panelHeight - 10 : position.y + AVATAR_SIZE + 10,
    viewport.height - panelHeight - 12,
  ));

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: position, moved: false };
  }

  function handlePointerMove(event) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    current.moved = true;
    setPosition(clampPosition({ x: current.origin.x + dx, y: current.origin.y + dy }, viewport));
  }

  function handlePointerUp(event) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved) return;
    const next = clampPosition({
      x: current.origin.x + event.clientX - current.startX,
      y: current.origin.y + event.clientY - current.startY,
    }, viewport);
    setPosition(next);
    suppressClick.current = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Persistencia opcional */ }
  }

  function handlePointerCancel(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleClick() {
    if (suppressClick.current) { suppressClick.current = false; return; }
    setOpen((value) => !value);
  }

  return (
    <div className="floating-assistant" hidden={hidden} style={{ left: position.x, top: position.y }}>
      <button
        type="button"
        className={`assistant-avatar-button assistant-status-${status}`}
        aria-label={open ? "Cerrar NutriAsistente" : "Abrir NutriAsistente. Arrastra para moverlo"}
        aria-expanded={open}
        aria-controls="nutri-assistant-panel"
        title="NutriAsistente · Arrastra para mover"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={() => { drag.current = null; }}
        onClick={handleClick}
      >
        <img src={avatar} alt="" draggable="false" />
        <span className="assistant-avatar-badge" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <defs><linearGradient id="assistant-star-gradient" x1="9" y1="7" x2="39" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#F4FBD8" /><stop offset=".5" stopColor="#D8F8EA" /><stop offset="1" stopColor="#8EE5BA" /></linearGradient></defs>
            <g className="assistant-spark-main">
              <path d="M22 5 26 18 39 22 26 26 22 39 18 26 5 22 18 18 22 5Z" fill="url(#assistant-star-gradient)" stroke="#63CFA4" strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M21.4 10.5 23.6 19.6 31.7 22" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="1" strokeLinecap="round" />
            </g>
            <path className="assistant-spark-small assistant-spark-top" d="M36 0 38.4 6.6 45 9 38.4 11.4 36 18 33.6 11.4 27 9 33.6 6.6 36 0Z" fill="#F4FBD8" stroke="#63CFA4" strokeWidth="0.9" strokeLinejoin="round" />
            <path className="assistant-spark-small assistant-spark-bottom" d="M8 29 10.4 35.6 17 38 10.4 40.4 8 47 5.6 40.4 -1 38 5.6 35.6 8 29Z" fill="#D8F8EA" stroke="#3EBF94" strokeWidth="0.9" strokeLinejoin="round" />
          </svg>
          <strong>IA</strong>
        </span>
      </button>
      <span className={`assistant-float-label ${position.x < viewport.width / 2 ? "assistant-label-left" : ""} ${viewport.width > 760 && position.x < 230 ? "assistant-label-docked" : ""}`} aria-hidden="true">NutriAsistente</span>

      <section
        id="nutri-assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-label="Consulta con NutriAsistente"
        className="assistant-panel"
        hidden={!open}
        style={{ left: panelLeft - position.x, top: panelTop - position.y, width: panelWidth, maxHeight: panelHeight }}
      >
        <header className="assistant-panel-header">
          <img src={avatar} alt="" />
          <div><strong>NutriAsistente</strong><span className={`assistant-state assistant-state-${status}`}><i />{statusLabels[status]}</span></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente"><X size={18} /></button>
        </header>
        <div className="assistant-panel-body">
          <label className="assistant-context-label" htmlFor="assistant-patient">Contexto de la consulta</label>
          <select id="assistant-patient" value={selectedPatient ? selectedId : ""} onChange={(event) => { setSelectedId(event.target.value); setStatus("idle"); }}>
            <option value="">Consulta general</option>
            {pacientes.map((p) => <option value={p.id} key={p.id}>{p.nombre}</option>)}
          </select>
          <AsistenteChat key={selectedPatient ? selectedId : "general"} paciente={selectedPatient} onStateChange={setStatus}
            onAbrirMenu={(paciente) => { setOpen(false); onAbrirMenu?.(paciente); }} />
        </div>
      </section>
    </div>
  );
}

export default FloatingAssistant;

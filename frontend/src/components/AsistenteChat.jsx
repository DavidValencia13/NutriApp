import { useState, useRef, useEffect } from "react";
import { chatAsistente } from "../services/asistenteService";

function BurbujaMensaje({ mensaje }) {
  const esUsuario = mensaje.rol === "usuario";
  return (
    <div
      className={`flex ${esUsuario ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}
    >
      {!esUsuario && (
        <div
          className="mr-2.5 mt-0.5 flex items-center justify-center shrink-0 font-display font-bold text-white text-xs"
          style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #0ECFC7, #818CF8)",
            boxShadow: "0 2px 8px rgba(14,207,199,0.3)",
            flexShrink: 0,
          }}
        >
          N+
        </div>
      )}
      <div
        className="max-w-[82%] text-sm leading-relaxed"
        style={{
          borderRadius: esUsuario ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "10px 14px",
          background: esUsuario
            ? "linear-gradient(135deg, #0ECFC7, #0BA89F)"
            : "#F8FAFC",
          color: esUsuario ? "#fff" : "#0D1829",
          border: esUsuario ? "none" : "1px solid #E8EEF5",
          boxShadow: esUsuario
            ? "0 3px 12px rgba(14,207,199,0.25)"
            : "0 1px 4px rgba(0,0,0,0.04)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {mensaje.contenido.split("\n").map((linea, i, arr) => (
          <span key={i}>
            {linea}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function IndicadorEscribiendo() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="mr-2.5 mt-0.5 flex items-center justify-center shrink-0 font-display font-bold text-white text-xs"
        style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, #0ECFC7, #818CF8)",
        }}
      >
        N+
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3"
        style={{
          borderRadius: "4px 14px 14px 14px",
          background: "#F8FAFC",
          border: "1px solid #E8EEF5",
        }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function AsistenteChat({ paciente }) {
  const [historial, setHistorial] = useState([]);
  const [input, setInput]         = useState("");
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState("");
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setHistorial([{
      rol: "asistente",
      contenido: paciente
        ? `Hola, soy NutriAsistente. Tengo el perfil completo de ${paciente.nombre} — peso, altura, objetivo y registros de seguimiento. ¿En qué te ayudo?`
        : "Hola, soy NutriAsistente. Puedo ayudarte con soporte de la app, dudas nutricionales o el seguimiento de tus pacientes. ¿En qué te ayudo?",
    }]);
  }, [paciente?.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [historial, cargando]);

  async function handleEnviar(e) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || cargando) return;

    const mensajeUsuario  = { rol: "usuario", contenido: texto };
    const nuevoHistorial  = [...historial, mensajeUsuario];

    setHistorial(nuevoHistorial);
    setInput("");
    setCargando(true);
    setError("");

    try {
      const { respuesta } = await chatAsistente({
        idPaciente: paciente?.id ?? null,
        mensaje: texto,
        historial: nuevoHistorial.slice(1),
      });
      setHistorial((prev) => [...prev, { rol: "asistente", contenido: respuesta }]);
    } catch (err) {
      setError(err.message || "Error al contactar el asistente");
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  }

  function handleLimpiar() {
    setHistorial([{
      rol: "asistente",
      contenido: paciente
        ? `Hola, soy NutriAsistente. Tengo el perfil completo de ${paciente.nombre}. ¿En qué te ayudo?`
        : "Hola, soy NutriAsistente. ¿En qué te ayudo?",
    }]);
    setError("");
  }

  return (
    <div className="flex flex-col" style={{ height: 520 }}>
      {/* Patient context bar */}
      {paciente && (
        <div
          className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs font-medium animate-fade-in"
          style={{
            background: "rgba(14,207,199,0.07)",
            border: "1px solid rgba(14,207,199,0.15)",
            color: "#0BA89F",
          }}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10" cy="7" r="3.5"/>
            <path d="M3 18c0-4 3.1-7 7-7s7 3 7 7"/>
          </svg>
          <span>
            <strong>{paciente.nombre}</strong>
            {" · "}
            {paciente.peso} kg · Objetivo: {paciente.objetivo}
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto rounded-xl px-3 py-3"
        style={{ background: "#FAFBFC", border: "1px solid #F0F4F8" }}
      >
        {historial.map((m, i) => (
          <BurbujaMensaje key={i} mensaje={m} />
        ))}
        {cargando && <IndicadorEscribiendo />}

        {historial.length > 1 && !cargando && (
          <div className="mt-1 text-center">
            <button
              onClick={handleLimpiar}
              className="text-xs transition-colors duration-150"
              style={{ color: "#CBD5E1", fontFamily: "'DM Sans', system-ui, sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.color = "#0ECFC7"}
              onMouseLeave={e => e.currentTarget.style.color = "#CBD5E1"}
            >
              Limpiar conversación
            </button>
          </div>
        )}
      </div>

      {error && (
        <p
          className="mt-2 text-xs px-3 py-2 rounded-lg animate-fade-in"
          style={{ background: "rgba(244,63,94,0.07)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.15)" }}
        >
          {error}
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleEnviar} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={cargando}
          placeholder={paciente ? `Pregunta sobre ${paciente.nombre}…` : "Escribe tu pregunta…"}
          className="flex-1 text-sm outline-none transition-all duration-200 disabled:opacity-50"
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#0D1829",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(14,207,199,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(14,207,199,0.1)"; }}
          onBlur={e  => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
        />
        <button
          type="submit"
          disabled={!input.trim() || cargando}
          aria-label="Enviar"
          className="flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            width: 42, height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0ECFC7, #0BA89F)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            boxShadow: "0 3px 10px rgba(14,207,199,0.3)",
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>

      <p
        className="mt-2 text-center"
        style={{ fontSize: 10, color: "#CBD5E1" }}
      >
        NutriAsistente complementa — no reemplaza — el criterio clínico del nutriólogo.
      </p>
    </div>
  );
}

export default AsistenteChat;

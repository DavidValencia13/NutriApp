import { useState, useRef, useEffect } from "react";
import { chatAsistente } from "../services/asistenteService";

function LogoLeaf() {
  return (
    <svg width="14" height="14" viewBox="8 8 17 17" fill="none" aria-hidden="true">
      <path d="M8.5 23.5C8.5 14 14 8.5 24 8.5C24 18.5 18 23.5 8.5 23.5Z" fill="#8EDDB3" />
      <path d="M8.5 23.5L18.5 13.5" stroke="#0F2A20" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BurbujaMensaje({ mensaje }) {
  const esUsuario = mensaje.rol === "usuario";
  return (
    <div
      className={`flex ${esUsuario ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}
    >
      {!esUsuario && (
        <div className="mr-2.5 mt-0.5 flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-nutri-ink">
          <LogoLeaf />
        </div>
      )}
      <div
        className={`max-w-[82%] text-sm leading-relaxed px-4 py-2.5 ${
          esUsuario
            ? "bg-nutri-ink text-white rounded-2xl rounded-tr-sm"
            : "bg-white text-nutri-ink border border-line rounded-2xl rounded-tl-sm"
        }`}
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
      <div className="mr-2.5 mt-0.5 flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-nutri-ink">
        <LogoLeaf />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-line rounded-2xl rounded-tl-sm">
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
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs bg-surface text-gray-700">
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
        className="flex-1 overflow-y-auto rounded-lg px-3 py-3 bg-surface"
      >
        {historial.map((m, i) => (
          <BurbujaMensaje key={i} mensaje={m} />
        ))}
        {cargando && <IndicadorEscribiendo />}

        {historial.length > 1 && !cargando && (
          <div className="mt-1 text-center">
            <button
              onClick={handleLimpiar}
              className="text-xs text-gray-400 hover:text-nutri-brand transition-colors cursor-pointer"
            >
              Limpiar conversación
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs px-3 py-2 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">
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
          maxLength={2000}
          placeholder={paciente ? `Pregunta sobre ${paciente.nombre}…` : "Escribe tu pregunta…"}
          className="flex-1 text-sm bg-white border border-gray-300 rounded-full px-4 py-2.5 text-nutri-ink placeholder-gray-400 outline-none transition-colors focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || cargando}
          aria-label="Enviar"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-nutri-ink hover:bg-nutri-ink-soft text-white shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>

      <p className="mt-2 text-center text-xs text-gray-400">
        NutriAsistente complementa — no reemplaza — el criterio clínico del nutriólogo.
      </p>
    </div>
  );
}

export default AsistenteChat;

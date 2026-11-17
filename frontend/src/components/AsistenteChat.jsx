import { useState, useRef, useEffect } from "react";
import { chatAsistente, chatAsistentePaciente } from "../services/asistenteService";
import { generarMenu, obtenerMenu } from "../services/menuService";
import { listarAlimentos, obtenerCoberturaCatalogo } from "../services/alimentoService";
import { catalogoPreparadoParaMenu } from "../utils/suficiencia";

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

function saludoInicial(paciente) {
  return {
    rol: "asistente",
    contenido: paciente
      ? `Hola, soy NutriAsistente. Puedo ayudarte a revisar el perfil y los registros disponibles de ${paciente.nombre}. ¿En qué te ayudo?`
      : "Hola, soy NutriAsistente. Puedo ayudarte con soporte de la app, dudas nutricionales o el seguimiento de tus pacientes. ¿En qué te ayudo?",
  };
}

function AsistenteChat({ paciente, onStateChange, onAbrirMenu, modoPaciente = false }) {
  const [historial, setHistorial] = useState(() => [saludoInicial(paciente)]);
  const [input, setInput]         = useState("");
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState("");
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [revisionPendiente, setRevisionPendiente] = useState(false);
  const listRef  = useRef(null);
  const inputRef = useRef(null);

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
    onStateChange?.("thinking");

    try {
      const { respuesta, accion } = await (modoPaciente ? chatAsistentePaciente : chatAsistente)({
        idPaciente: paciente?.id ?? null,
        mensaje: texto,
        historial: historial.slice(1),
      });
      if (!modoPaciente && paciente && accion?.tipo === "crear_borrador_menu") {
        const [cobertura, alimentos, versionActual] = await Promise.all([
          obtenerCoberturaCatalogo(paciente.id),
          listarAlimentos(paciente.id),
          obtenerMenu(paciente.id),
        ]);
        if (!catalogoPreparadoParaMenu(cobertura, alimentos.length)) {
          const motivos = (cobertura.alertas || []).filter((alerta) => alerta.grupoSugerido || alerta.gruposSugeridos?.length)
            .slice(0, 3).map((alerta) => alerta.mensaje).filter(Boolean);
          const introduccion = versionActual
            ? "El menú actual sigue disponible. Para crear una nueva versión, revisa primero los alimentos del paciente."
            : "Para generar el primer menú, revisa primero los alimentos del paciente.";
          setHistorial((prev) => [...prev, { rol: "asistente", contenido: `${introduccion} ${motivos.join(" ") || "Completa las cantidades, la variedad y las fichas nutricionales pendientes."}` }]);
          setAccionPendiente(null);
          setRevisionPendiente(true);
          onStateChange?.("ready");
          return;
        }
        setHistorial((prev) => [...prev, { rol: "asistente", contenido: respuesta }]);
        setAccionPendiente({ idVersionActual: versionActual?.id ?? null });
        setRevisionPendiente(false);
      } else {
        setHistorial((prev) => [...prev, { rol: "asistente", contenido: respuesta }]);
        setAccionPendiente(null);
        setRevisionPendiente(false);
      }
      onStateChange?.("ready");
    } catch (err) {
      setError(err.message || "Error al contactar el asistente");
      onStateChange?.("error");
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  }

  async function handleGenerarMenu() {
    if (!paciente || !accionPendiente || cargando) return;
    setCargando(true);
    setError("");
    onStateChange?.("thinking");
    try {
      await generarMenu(paciente.id, {
        confirmarNuevaVersion: accionPendiente.idVersionActual !== null,
        idVersionActual: accionPendiente.idVersionActual,
      });
      setAccionPendiente(null);
      setHistorial((prev) => [...prev, { rol: "asistente", contenido: "Borrador creado. Revísalo y apruébalo cuando esté listo para el paciente." }]);
      onStateChange?.("ready");
      onAbrirMenu?.(paciente, "resumen");
    } catch (err) {
      setError(err.message || "No se pudo generar el menú");
      onStateChange?.("error");
    } finally {
      setCargando(false);
    }
  }

  function handleLimpiar() {
    setHistorial([saludoInicial(paciente)]);
    setError("");
    setAccionPendiente(null);
    setRevisionPendiente(false);
    onStateChange?.("idle");
  }

  return (
    <div className="assistant-chat flex flex-col">
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
        className="assistant-messages flex-1 overflow-y-auto rounded-lg px-3 py-3 bg-surface"
      >
        {historial.map((m, i) => (
          <BurbujaMensaje key={i} mensaje={m} />
        ))}
        {cargando && <IndicadorEscribiendo />}

        {accionPendiente && !cargando && (
          <div className="ml-10 mb-3 rounded-xl border border-nutri-brand/30 bg-white p-3 text-xs text-nutri-ink">
            <p className="mb-2">{accionPendiente.idVersionActual
              ? "Se creará una nueva versión como borrador. El menú actual seguirá disponible hasta que apruebes la propuesta."
              : "Se creará un borrador de menú semanal para este paciente."}</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleGenerarMenu} className="rounded-lg bg-nutri-ink px-3 py-2 text-white">Confirmar y generar borrador</button>
              <button type="button" onClick={() => setAccionPendiente(null)} className="rounded-lg border border-line px-3 py-2">Cancelar</button>
            </div>
          </div>
        )}

        {revisionPendiente && !cargando && (
          <div className="ml-10 mb-3 rounded-xl border border-nutri-brand/30 bg-white p-3 text-xs text-nutri-ink">
            <button type="button" onClick={() => onAbrirMenu?.(paciente, "alimentos")} className="rounded-lg bg-nutri-ink px-3 py-2 text-white">Revisar alimentos del paciente</button>
          </div>
        )}

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
          onChange={(e) => { setInput(e.target.value); onStateChange?.(e.target.value.trim() ? "reading" : "idle"); }}
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

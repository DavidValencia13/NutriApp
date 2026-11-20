import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

// Recorrido guiado: globos que señalan, uno por uno, las partes reales de la
// pantalla (el elemento con data-tour="..."). Lo demás se oscurece. Si el
// elemento no está (ej. todavía no hay pacientes), el globo sale centrado.
const MARGEN = 8; // aire alrededor del elemento iluminado
const ANCHO_GLOBO = 340;

function medir(selector) {
  if (!selector) return null;
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top - MARGEN, left: r.left - MARGEN, width: r.width + MARGEN * 2, height: r.height + MARGEN * 2 };
}

// Debajo del elemento si cabe; si no, encima; siempre dentro de la pantalla
function posicionGlobo(rect) {
  const anchoVentana = window.innerWidth;
  const altoVentana = window.innerHeight;
  const ancho = Math.min(ANCHO_GLOBO, anchoVentana - 32);
  const left = Math.min(Math.max(16, rect.left + rect.width / 2 - ancho / 2), anchoVentana - ancho - 16);
  const abajo = rect.top + rect.height + 12;
  if (abajo + 220 < altoVentana) return { top: abajo, left, width: ancho };
  return { bottom: altoVentana - rect.top + 12, left, width: ancho };
}

function RecorridoGuiado({ pasos, abierto, onCerrar }) {
  const [indice, setIndice] = useState(0);
  const [rect, setRect] = useState(null);
  const paso = pasos[indice];
  const ultimo = indice === pasos.length - 1;

  function cerrar() {
    setIndice(0);
    onCerrar();
  }

  // Lleva el elemento a la vista y sigue su posición si la página se mueve
  useEffect(() => {
    if (!abierto) return undefined;
    const el = paso.selector && document.querySelector(`[data-tour="${paso.selector}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    const actualizar = () => setRect(medir(paso.selector));
    const frame = requestAnimationFrame(actualizar);
    const tardio = setTimeout(actualizar, 350); // tras el scroll suave
    window.addEventListener("resize", actualizar);
    window.addEventListener("scroll", actualizar, true);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(tardio);
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("scroll", actualizar, true);
    };
  }, [abierto, paso]);

  // Teclado: flechas para moverse, Esc para salir
  useEffect(() => {
    if (!abierto) return undefined;
    function tecla(e) {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight" || e.key === "Enter") ultimo ? cerrar() : setIndice((i) => i + 1);
      else if (e.key === "ArrowLeft") setIndice((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  if (!abierto) return null;

  const estiloGlobo = rect
    ? posicionGlobo(rect)
    : (() => {
      // Centrado sin transform: la animación de entrada lo reemplazaba y el
      // globo quedaba corrido fuera de la pantalla en celulares
      const ancho = Math.min(ANCHO_GLOBO + 60, window.innerWidth - 32);
      return { top: Math.max(16, window.innerHeight / 2 - 140), left: Math.max(16, (window.innerWidth - ancho) / 2), width: ancho };
    })();

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="recorrido-titulo">
      {/* Fondo: bloquea clics; con elemento, la "ventana" iluminada es la sombra del recuadro */}
      <div className="absolute inset-0" style={rect ? undefined : { background: "rgb(15 42 32 / 0.55)" }} />
      {rect && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            ...rect,
            boxShadow: "0 0 0 9999px rgb(15 42 32 / 0.55), 0 0 0 3px var(--color-nutri-mint)",
            transition: "all .3s ease",
          }}
        />
      )}

      <div
        key={indice}
        className="absolute bg-white rounded-xl shadow-2xl p-5 animate-fade-in-up"
        style={{ ...estiloGlobo, transition: "top .3s ease, left .3s ease" }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold text-nutri-brand">
            {paso.etiqueta || `Paso ${indice} de ${pasos.length - 1}`}
          </p>
          <button onClick={cerrar} aria-label="Cerrar guía" className="-mt-1 -mr-1 p-1 text-gray-400 hover:text-nutri-ink cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <h3 id="recorrido-titulo" className="font-semibold text-lg leading-snug mt-1">
          {paso.titulo}
        </h3>
        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{paso.texto}</p>

        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-1.5" aria-hidden="true">
            {pasos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === indice ? "w-5 bg-nutri-brand" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {indice === 0 ? (
              <button onClick={cerrar} className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-nutri-ink cursor-pointer">
                Saltar
              </button>
            ) : (
              <button
                onClick={() => setIndice((i) => i - 1)}
                aria-label="Paso anterior"
                className="p-2 rounded-lg text-gray-500 hover:bg-surface hover:text-nutri-ink cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={() => (ultimo ? cerrar() : setIndice((i) => i + 1))}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-nutri-brand text-white hover:bg-nutri-ink cursor-pointer"
            >
              {ultimo ? "Empezar" : indice === 0 ? "Comenzar recorrido" : "Siguiente"}
              {!ultimo && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecorridoGuiado;

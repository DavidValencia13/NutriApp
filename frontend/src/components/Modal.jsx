import { useEffect, useRef } from "react";

function Modal({ isOpen, onClose, title, children, ancho = "max-w-lg" }) {
  const closeButtonRef = useRef(null);

  // Cierra con Escape y enfoca el botón de cierre al abrir, sin importar
  // cuánto contenido tenga el body — accesibilidad mínima de teclado.
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Fondo oscuro semi-transparente que cubre toda la pantalla
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* flex-col + overflow-hidden aquí, overflow-y-auto solo en el body:
          así el header (título + cerrar) queda fijo sin importar qué tan
          largo sea el contenido, en vez de scrollear junto con todo. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-lg shadow-xl w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-nutri-navy">{title}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
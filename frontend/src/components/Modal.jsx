import { useEffect, useRef } from "react";

function Modal({ isOpen, onClose, title, children, ancho = "max-w-lg" }) {
  const closeButtonRef = useRef(null);

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
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,42,32,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-card bg-white w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-line">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-nutri-ink hover:bg-surface transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/>
              <line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;

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
      style={{ background: "rgba(7,14,26,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-card bg-white w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden`}
        style={{
          borderRadius: 18,
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(14,207,199,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid #E8EEF5" }}
        >
          <h2
            className="font-display font-bold"
            style={{ color: "#0D1829", fontSize: 16, letterSpacing: "-0.3px" }}
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              width: 32, height: 32,
              background: "rgba(13,24,41,0.05)",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; e.currentTarget.style.color = "#F43F5E"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(13,24,41,0.05)"; e.currentTarget.style.color = "#64748B"; }}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/>
              <line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;

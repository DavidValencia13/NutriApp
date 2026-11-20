import { Component } from "react";

// Si algo falla al dibujar la app (p. ej. un navegador muy antiguo), en vez
// de una pantalla en blanco se muestra este aviso con el detalle del error,
// para poder reportarlo.
class ErrorPantalla extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error en la app:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const navegador = typeof navigator !== "undefined" ? navigator.userAgent : "";
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f4f7f6", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 440, width: "100%", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,.08)", color: "#1f2937" }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px", color: "#14532d" }}>Algo no cargó bien</h1>
          <p style={{ margin: "0 0 16px", lineHeight: 1.5 }}>
            Tu información está a salvo. Toca <strong>Recargar</strong>. Si vuelve a pasar, prueba con la última versión de Google Chrome
            y envía una captura de esta pantalla a quien te compartió NutriApp.
          </p>
          <button type="button" onClick={() => window.location.reload()}
            style={{ width: "100%", padding: "12px 16px", border: 0, borderRadius: 10, background: "#15803d", color: "#fff", fontSize: 16, fontWeight: 600 }}>
            Recargar
          </button>
          <details style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
            <summary>Detalle técnico</summary>
            <p style={{ wordBreak: "break-word" }}>{String(error?.message || error)}</p>
            <p style={{ wordBreak: "break-word" }}>{navegador}</p>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorPantalla;

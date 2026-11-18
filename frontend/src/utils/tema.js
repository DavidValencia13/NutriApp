// Modo claro / oscuro. Se guarda en este dispositivo y se aplica como clase
// "tema-oscuro" en <html> (los estilos están al final de index.css).
const CLAVE = "nutriapp-tema";

export function temaGuardado() {
  try {
    return localStorage.getItem(CLAVE) === "oscuro" ? "oscuro" : "claro";
  } catch {
    return "claro";
  }
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle("tema-oscuro", tema === "oscuro");
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    /* sin almacenamiento: igual se aplica en esta visita */
  }
  window.dispatchEvent(new CustomEvent("nutriapp-tema", { detail: tema }));
}

// Al cargar la app, antes de dibujar, para que no parpadee en claro
export function iniciarTema() {
  document.documentElement.classList.toggle("tema-oscuro", temaGuardado() === "oscuro");
}

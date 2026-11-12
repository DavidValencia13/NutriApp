// Punto único de acceso a la IA para respuestas JSON (menús, traducción de
// alimentos). IA_PROVIDER en el .env elige el proveedor:
//   "groq" (por defecto) | "anthropic" (Claude)
// Se lee en cada llamada, así que basta con cambiar el .env y reiniciar.
const groq = require("./groqClient");
const anthropic = require("./anthropicClient");

function proveedorIA() {
  return (process.env.IA_PROVIDER || "groq").toLowerCase() === "anthropic"
    ? "anthropic"
    : "groq";
}

async function pedirCompletion(messages, opciones = {}) {
  return proveedorIA() === "anthropic"
    ? anthropic.pedirCompletionJSON(messages, opciones)
    : groq.pedirCompletion(messages, opciones);
}

module.exports = { pedirCompletion, proveedorIA };

const AsistenteGroq = require("./AsistenteGroq");
const AsistenteAnthropic = require("./AsistenteAnthropic");

/**
 * Devuelve el adaptador de IA configurado en IA_PROVIDER.
 * Valores válidos: "groq" (default) | "anthropic"
 */
function crearAsistenteIA() {
  const provider = (process.env.IA_PROVIDER || "groq").toLowerCase();

  if (provider === "anthropic") return new AsistenteAnthropic();
  return new AsistenteGroq();
}

module.exports = { crearAsistenteIA };

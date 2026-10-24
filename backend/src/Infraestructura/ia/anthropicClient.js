class AnthropicTimeoutError extends Error {}
class AnthropicRequestError extends Error {}
class AnthropicRateLimitError extends Error {
  constructor(message, retryAfterSeconds) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const ANTHROPIC_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS) || 30000;

// Lazy-load para no romper si el paquete no está instalado todavía
function getAnthropicClient() {
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const AnthropicClass = Anthropic.default || Anthropic;
    return new AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    throw new AnthropicRequestError(
      "El paquete @anthropic-ai/sdk no está instalado. Ejecuta: npm install @anthropic-ai/sdk"
    );
  }
}

/**
 * Envía mensajes a la API de Anthropic (Claude).
 * @param {Array<{role: string, content: string}>} messages - Historial de mensajes (sin system).
 * @param {string} systemPrompt - Instrucción de sistema.
 * @returns {Promise<string>} Texto de respuesta del modelo.
 */
async function pedirCompletion(messages, systemPrompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnthropicRequestError("ANTHROPIC_API_KEY no está configurada");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  const client = getAnthropicClient();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new AnthropicTimeoutError("Anthropic no respondió dentro del timeout configurado")),
      ANTHROPIC_TIMEOUT_MS
    )
  );

  try {
    const response = await Promise.race([
      client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
      timeoutPromise,
    ]);

    return response.content[0].text;
  } catch (error) {
    if (error instanceof AnthropicTimeoutError) throw error;

    // El SDK de Anthropic usa status en el error para rate limit
    if (error.status === 429) {
      const retryAfter = error.headers?.["retry-after"];
      const retryAfterSeconds = retryAfter ? Math.ceil(Number(retryAfter)) : undefined;
      throw new AnthropicRateLimitError(
        "Anthropic respondió con estado 429 (límite de solicitudes alcanzado)",
        retryAfterSeconds
      );
    }

    if (error instanceof AnthropicRequestError) throw error;
    throw new AnthropicRequestError(error.message || "Error desconocido al llamar a Anthropic");
  }
}

module.exports = {
  pedirCompletion,
  AnthropicTimeoutError,
  AnthropicRequestError,
  AnthropicRateLimitError,
};

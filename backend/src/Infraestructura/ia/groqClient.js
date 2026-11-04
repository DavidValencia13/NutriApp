class GroqTimeoutError extends Error {}
class GroqRequestError extends Error {}
class GroqRateLimitError extends Error {
  constructor(message, retryAfterSeconds) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 20000;
const GROQ_REASONING_EFFORT = process.env.GROQ_REASONING_EFFORT || "low";
// Sin un tope explícito Groq corta la respuesta (~3000 tokens) y el menú de
// 7 días llega incompleto. Prompt + este valor debe caber en el límite de
// tokens por minuto de la cuenta (8000 en el plan gratuito).
const GROQ_MAX_COMPLETION_TOKENS = Number(process.env.GROQ_MAX_COMPLETION_TOKENS) || 5500;

async function pedirCompletion(messages) {
  if (!process.env.GROQ_API_KEY) {
    throw new GroqRequestError("GROQ_API_KEY no está configurada");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        response_format: { type: "json_object" },
        max_completion_tokens: GROQ_MAX_COMPLETION_TOKENS,
        // Los modelos gpt-oss razonan antes de responder; con razonamiento
        // alto en modo JSON gastan el tope de tokens y no devuelven nada
        // (json_validate_failed)
        ...(GROQ_MODEL.startsWith("openai/gpt-oss") && {
          reasoning_effort: GROQ_REASONING_EFFORT,
        }),
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const retryAfterSeconds =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.ceil(retryAfter)
          : undefined;
      throw new GroqRateLimitError(
        "Groq respondió con estado 429 (límite de solicitudes alcanzado)",
        retryAfterSeconds,
      );
    }
    if (!response.ok) {
      // El cuerpo trae el motivo real (modelo inexistente, JSON inválido, etc.)
      const detalle = await response.text().catch(() => "");
      throw new GroqRequestError(
        `Groq respondió con estado ${response.status}: ${detalle.slice(0, 300)}`,
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new GroqTimeoutError("Groq no respondió dentro del timeout configurado");
    }
    if (error instanceof GroqRateLimitError) throw error;
    if (error instanceof GroqRequestError) throw error;
    throw new GroqRequestError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { pedirCompletion, GroqTimeoutError, GroqRequestError, GroqRateLimitError };

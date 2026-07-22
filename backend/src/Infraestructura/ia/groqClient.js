class GroqTimeoutError extends Error {}
class GroqRequestError extends Error {}

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 20000;

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
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GroqRequestError(`Groq respondió con estado ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new GroqTimeoutError("Groq no respondió dentro del timeout configurado");
    }
    if (error instanceof GroqRequestError) throw error;
    throw new GroqRequestError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { pedirCompletion, GroqTimeoutError, GroqRequestError };

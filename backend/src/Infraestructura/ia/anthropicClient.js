const { IATimeoutError, IARequestError, IARateLimitError } = require("./errores");

class AnthropicTimeoutError extends IATimeoutError {}
class AnthropicRequestError extends IARequestError {}
class AnthropicRateLimitError extends IARateLimitError {}

const ANTHROPIC_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS) || 30000;
// El menú semanal es una respuesta larga (7 días de comidas en JSON)
const ANTHROPIC_TIMEOUT_MENU_MS = Number(process.env.ANTHROPIC_TIMEOUT_MENU_MS) || 120000;
const MODELO_POR_DEFECTO = "claude-haiku-5-5";
// Menús: con Haiku los platos salían incoherentes y no respetaba el
// inventario aun corrigiéndolo (3 intentos fallidos); Sonnet 5.5 generó un
// menú coherente al primer intento por ~$0.04. Se cambia con
// ANTHROPIC_MODEL_MENU.
const MODELO_MENU_POR_DEFECTO = "claude-sonnet-5-5";
// Razonamiento al generar el menú. Con el razonamiento activado el modelo
// gasta todo max_tokens pensando (el pedido del menú pide sumar precios e
// inventario de 7 días) y no llega a escribir el menú; sin razonamiento lo
// genera en ~10 s por ~$0.002 con Haiku. Las sumas las corrige el código
// (GenerarMenuSemanal._ajustarAlInventario). Cada modelo lo apaga distinto:
//   Haiku: thinking "disabled" | Sonnet 5.5: "between_tools" |
//   Opus 5.5 y otros no permiten apagarlo: esfuerzo bajo (ANTHROPIC_EFFORT_MENU)
function razonamientoMenu(modelo) {
  if (modelo.startsWith("claude-haiku")) return { thinking: { type: "disabled" } };
  if (modelo.startsWith("claude-sonnet-5-5")) return { thinking: { type: "between_tools" } };
  return { output_config: { effort: process.env.ANTHROPIC_EFFORT_MENU || "low" } };
}

// Lazy-load para no romper si el paquete no está instalado todavía
let Anthropic = null;
function getAnthropicClient() {
  try {
    Anthropic = Anthropic || require("@anthropic-ai/sdk");
    const AnthropicClass = Anthropic.default || Anthropic;
    return new AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1 });
  } catch {
    throw new AnthropicRequestError(
      "El paquete @anthropic-ai/sdk no está instalado. Ejecuta: npm install @anthropic-ai/sdk",
    );
  }
}

// La respuesta trae varios bloques: con el razonamiento activado (por
// defecto en los modelos actuales) el primero es de tipo "thinking" y viene
// vacío. El texto de la respuesta está en los bloques de tipo "text".
function textoDeRespuesta(response) {
  if (response.stop_reason === "refusal") {
    throw new AnthropicRequestError("Claude declinó responder esta solicitud");
  }
  const texto = (response.content || [])
    .filter((bloque) => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("");
  if (!texto) throw new AnthropicRequestError("Claude devolvió una respuesta vacía");
  return texto;
}

// Claude a veces envuelve el JSON en ```json ... ```: se devuelve solo el
// objeto, para que quien lo consuma pueda hacer JSON.parse igual que con Groq
function extraerJSON(texto) {
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  return inicio !== -1 && fin > inicio ? texto.slice(inicio, fin + 1) : texto;
}

async function crearMensaje(params, timeoutMs) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnthropicRequestError("ANTHROPIC_API_KEY no está configurada");
  }
  const client = getAnthropicClient();
  try {
    return await client.messages.create(params, { timeout: timeoutMs });
  } catch (error) {
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      throw new AnthropicTimeoutError("Anthropic no respondió dentro del timeout configurado");
    }
    if (error instanceof Anthropic.RateLimitError) {
      const retryAfter = error.headers?.get?.("retry-after") ?? error.headers?.["retry-after"];
      throw new AnthropicRateLimitError(
        "Anthropic respondió con estado 429 (límite de solicitudes alcanzado)",
        retryAfter ? Math.ceil(Number(retryAfter)) : undefined,
      );
    }
    if (error instanceof Anthropic.APIError) {
      throw new AnthropicRequestError(`Anthropic respondió con estado ${error.status}: ${error.message}`);
    }
    throw new AnthropicRequestError(error.message || "Error desconocido al llamar a Anthropic");
  }
}

/**
 * Chat del asistente: texto libre.
 * @param {Array<{role: string, content: string}>} messages - Historial de mensajes (sin system).
 * @param {string} systemPrompt - Instrucción de sistema.
 * @returns {Promise<string>} Texto de respuesta del modelo.
 */
async function pedirCompletion(messages, systemPrompt) {
  const response = await crearMensaje(
    {
      model: process.env.ANTHROPIC_MODEL || MODELO_POR_DEFECTO,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    },
    ANTHROPIC_TIMEOUT_MS,
  );
  return textoDeRespuesta(response);
}

/**
 * Misma interfaz que groqClient.pedirCompletion: recibe mensajes estilo
 * OpenAI (los de rol "system" van al campo system de Claude) y devuelve un
 * texto JSON. Lo usan el generador de menús y la traducción de alimentos.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ tarea?: "menu" | "traduccion" }} opciones
 *   tarea "menu": modelo ANTHROPIC_MODEL_MENU (si está), sin razonamiento
 *   (ver razonamientoMenu) y timeout largo;
 *   tarea "traduccion": esfuerzo bajo (respuesta corta y rápida).
 *   (temperature, que usa Groq, se ignora: los modelos actuales de Claude
 *   no la aceptan)
 */
async function pedirCompletionJSON(messages, opciones = {}) {
  const esMenu = opciones.tarea === "menu";
  // Preparación: modelo barato (ANTHROPIC_MODEL), sin razonamiento y con
  // timeout largo (son los pasos de toda la semana en una sola respuesta)
  const esPreparacion = opciones.tarea === "preparacion";
  const sistema = messages.filter((m) => m.role === "system").map((m) => m.content);
  sistema.push(
    "Responde únicamente con un objeto JSON válido, sin texto antes ni después y sin bloques de código.",
  );

  const modelo = esMenu
    ? process.env.ANTHROPIC_MODEL_MENU || MODELO_MENU_POR_DEFECTO
    : process.env.ANTHROPIC_MODEL || MODELO_POR_DEFECTO;
  const response = await crearMensaje(
    {
      model: modelo,
      max_tokens: 16000,
      system: sistema.join("\n\n"),
      messages: messages.filter((m) => m.role !== "system"),
      ...(opciones.tarea === "traduccion" && { output_config: { effort: "low" } }),
      ...((esMenu || esPreparacion) && razonamientoMenu(modelo)),
    },
    esMenu || esPreparacion ? ANTHROPIC_TIMEOUT_MENU_MS : ANTHROPIC_TIMEOUT_MS,
  );
  return extraerJSON(textoDeRespuesta(response));
}

module.exports = {
  pedirCompletion,
  pedirCompletionJSON,
  textoDeRespuesta,
  extraerJSON,
  razonamientoMenu,
  AnthropicTimeoutError,
  AnthropicRequestError,
  AnthropicRateLimitError,
};

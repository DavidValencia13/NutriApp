const IAsistenteIA = require("../Dominio/Ports/IAsistenteIA");
const {
  pedirCompletion,
  GroqTimeoutError,
  GroqRateLimitError,
} = require("../../../Infraestructura/ia/groqClient");
const { ServicioExternoError } = require("./Errores");

class AsistenteGroq extends IAsistenteIA {
  constructor(completion = pedirCompletion) {
    super();
    this.completion = completion;
  }

  async chat({ historial, systemPrompt }) {
    // Groq usa el rol "system" como primer mensaje del array
    const messages = [
      { role: "system", content: `${systemPrompt}\nResponde exclusivamente con un objeto JSON cuya clave "respuesta" contenga el texto para el usuario.` },
      ...historial,
    ];

    let respuesta;
    try {
      respuesta = await this.completion(messages);
    } catch (error) {
      console.error("Error al llamar a Groq (asistente):", error.message);

      if (error instanceof GroqTimeoutError) {
        throw new ServicioExternoError("El asistente no respondió a tiempo", 504);
      }
      if (error instanceof GroqRateLimitError) {
        const espera = error.retryAfterSeconds
          ? ` Espera ${error.retryAfterSeconds} segundos.`
          : "";
        throw new ServicioExternoError(`Límite de Groq alcanzado.${espera}`, 429);
      }
      throw new ServicioExternoError("El asistente no está disponible en este momento", 502);
    }

    try {
      const contenido = JSON.parse(respuesta).respuesta;
      if (typeof contenido === "string" && contenido.trim()) return contenido.trim();
    } catch {
      // El proveedor devolvió un JSON inválido.
    }
    throw new ServicioExternoError("El asistente devolvió una respuesta inválida", 502);
  }
}

module.exports = AsistenteGroq;

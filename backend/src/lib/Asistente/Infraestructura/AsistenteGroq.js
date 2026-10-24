const IAsistenteIA = require("../Dominio/Ports/IAsistenteIA");
const {
  pedirCompletion,
  GroqTimeoutError,
  GroqRateLimitError,
} = require("../../../Infraestructura/ia/groqClient");
const { ServicioExternoError } = require("./Errores");

class AsistenteGroq extends IAsistenteIA {
  async chat({ historial, systemPrompt }) {
    // Groq usa el rol "system" como primer mensaje del array
    const messages = [
      { role: "system", content: systemPrompt },
      ...historial,
    ];

    let respuesta;
    try {
      respuesta = await pedirCompletion(messages);
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

    return respuesta;
  }
}

module.exports = AsistenteGroq;

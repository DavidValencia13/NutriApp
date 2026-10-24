const IAsistenteIA = require("../Dominio/Ports/IAsistenteIA");
const {
  pedirCompletion,
  AnthropicTimeoutError,
  AnthropicRateLimitError,
} = require("../../../Infraestructura/ia/anthropicClient");
const { ServicioExternoError } = require("./Errores");

class AsistenteAnthropic extends IAsistenteIA {
  async chat({ historial, systemPrompt }) {
    // Anthropic recibe system por separado y el historial como messages[]
    let respuesta;
    try {
      respuesta = await pedirCompletion(historial, systemPrompt);
    } catch (error) {
      console.error("Error al llamar a Anthropic (asistente):", error.message);

      if (error instanceof AnthropicTimeoutError) {
        throw new ServicioExternoError("El asistente no respondió a tiempo", 504);
      }
      if (error instanceof AnthropicRateLimitError) {
        const espera = error.retryAfterSeconds
          ? ` Espera ${error.retryAfterSeconds} segundos.`
          : "";
        throw new ServicioExternoError(`Límite de Anthropic alcanzado.${espera}`, 429);
      }
      throw new ServicioExternoError("El asistente no está disponible en este momento", 502);
    }

    return respuesta;
  }
}

module.exports = AsistenteAnthropic;

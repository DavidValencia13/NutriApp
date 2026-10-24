/**
 * Puerto que deben implementar todos los adaptadores de IA para el asistente.
 * Un adaptador recibe el historial de la conversación y el contexto clínico
 * del paciente, y devuelve la respuesta del modelo.
 */
class IAsistenteIA {
  /**
   * @param {object} params
   * @param {Array<{role: "user"|"assistant", content: string}>} params.historial
   * @param {string} params.systemPrompt - Instrucción de sistema con contexto del paciente.
   * @returns {Promise<string>} Texto de respuesta del modelo.
   */
  async chat({ historial, systemPrompt }) {
    throw new Error("No implementado");
  }
}

module.exports = IAsistenteIA;

/**
 * Caso de uso: ChatAsistente
 *
 * Orquesta el chat del asistente nutricional. Recibe un mensaje del nutriólogo
 * o del paciente, enriquece el contexto con datos reales del paciente desde la
 * base de datos, y delega la generación de la respuesta al adaptador de IA
 * configurado (Groq o Anthropic).
 */
class ChatAsistente {
  /**
   * @param {object} deps
   * @param {import("../../Paciente/Dominio/Ports/IPacienteRepository")} deps.pacienteRepo
   * @param {import("../../Seguimiento/Dominio/Ports/ISeguimientoRepository")} deps.seguimientoRepo
   * @param {import("../Dominio/Ports/IAsistenteIA")} deps.asistenteIA
   */
  constructor({ pacienteRepo, seguimientoRepo, asistenteIA }) {
    this.pacienteRepo = pacienteRepo;
    this.seguimientoRepo = seguimientoRepo;
    this.asistenteIA = asistenteIA;
  }

  /**
   * @param {object} params
   * @param {number|null} params.idPaciente - null si la consulta es sobre la app en general.
   * @param {string} params.mensaje - Mensaje actual del usuario.
   * @param {Array<{rol: "usuario"|"asistente", contenido: string}>} params.historial
   * @param {number} params.idNutriologo - Para verificar que el paciente pertenece a este nutriólogo.
   * @returns {Promise<{respuesta: string, proveedor: string}>}
   */
  async ejecutar({ idPaciente, mensaje, historial = [], idNutriologo }) {
    let contextoPaciente = null;

    if (idPaciente) {
      const paciente = await this.pacienteRepo.findById(idPaciente);

      // Solo incluye el paciente si pertenece al nutriólogo que consulta
      if (paciente && paciente.idNutriologo === idNutriologo) {
        const registros = await this.seguimientoRepo.listarPorPaciente(idPaciente);
        contextoPaciente = { paciente, registros };
      }
    }

    const systemPrompt = this._construirSystemPrompt(contextoPaciente);

    // Convierte el historial interno a formato OpenAI/Anthropic
    const historialFormateado = historial.map((m) => ({
      role: m.rol === "usuario" ? "user" : "assistant",
      content: m.contenido,
    }));

    // Agrega el mensaje actual como último turno del usuario
    historialFormateado.push({ role: "user", content: mensaje });

    const respuesta = await this.asistenteIA.chat({
      historial: historialFormateado,
      systemPrompt,
    });

    return {
      respuesta,
      proveedor: process.env.IA_PROVIDER || "groq",
    };
  }

  _construirSystemPrompt(contextoPaciente) {
    const base = `Eres NutriAsistente, un asistente de apoyo nutricional integrado en NutriApp.
Tu función es ayudar al nutriólogo y a sus pacientes con consultas sobre planes alimenticios, \
seguimiento y uso de la aplicación.

REGLAS IMPORTANTES:
- Responde siempre en español, de forma clara y empática.
- No eres un médico ni un nutriólogo. Apoyas al profesional, no lo reemplazas.
- Si te preguntan sobre síntomas graves o condiciones médicas complejas, recomienda consultar directamente con el nutriólogo o médico.
- Nunca inventes datos del paciente: usa solo los que te proporciona el contexto.
- Cuando el contexto de paciente no esté disponible, responde en términos generales sobre nutrición y uso de la app.`;

    if (!contextoPaciente) return base;

    const { paciente, registros } = contextoPaciente;

    // Últimos 5 registros de seguimiento para no sobrecargar el contexto
    const ultimosRegistros = registros.slice(-5);
    const resumenSeguimiento =
      ultimosRegistros.length > 0
        ? ultimosRegistros
            .map(
              (r) =>
                `- ${new Date(r.fecha).toLocaleDateString("es-EC")}: ` +
                `peso ${r.peso ? r.peso + " kg" : "no registrado"}, ` +
                `cumplimiento ${r.nivelCumplimiento}` +
                (r.observaciones ? `, observación: "${r.observaciones}"` : "")
            )
            .join("\n")
        : "Sin registros de seguimiento aún.";

    return `${base}

--- CONTEXTO DEL PACIENTE ACTIVO ---
Nombre: ${paciente.nombre}
Peso actual: ${paciente.peso} kg | Peso inicial: ${paciente.pesoInicial} kg | Altura: ${paciente.altura} cm
Objetivo: ${paciente.objetivo}
Nivel de actividad: ${paciente.nivelActividad}
Número de comidas al día: ${paciente.numeroComidas}
Presupuesto semanal: $${paciente.presupuesto}
Tiempo disponible para cocinar: ${paciente.tiempoParaCocinar} minutos
Restricciones: ${paciente.restricciones || "ninguna"}
Preferencias: ${paciente.preferencias || "ninguna"}
Alergias: ${paciente.alergias?.length ? paciente.alergias.join(", ") : "ninguna"}
Enfermedades: ${paciente.enfermedades?.length ? paciente.enfermedades.join(", ") : "ninguna"}
${paciente.edad ? `Edad: ${paciente.edad} años` : ""}
${paciente.sexo ? `Sexo: ${paciente.sexo}` : ""}

--- ÚLTIMOS REGISTROS DE SEGUIMIENTO ---
${resumenSeguimiento}
--- FIN DE CONTEXTO ---`;
  }
}

module.exports = ChatAsistente;

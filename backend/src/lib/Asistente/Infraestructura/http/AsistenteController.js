// Límites para no enviar conversaciones enormes al proveedor de IA (costo y cuota)
const MAX_LARGO_MENSAJE = 2000;
const MAX_MENSAJES_HISTORIAL = 20;

// Conserva solo los últimos turnos con forma válida y recorta su contenido
function sanitizarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter(
      (m) =>
        m &&
        (m.rol === "usuario" || m.rol === "asistente") &&
        typeof m.contenido === "string",
    )
    .slice(-MAX_MENSAJES_HISTORIAL)
    .map((m) => ({ rol: m.rol, contenido: m.contenido.slice(0, MAX_LARGO_MENSAJE * 2) }));
}

class AsistenteController {
  constructor({ chatAsistente }) {
    this.chatAsistente = chatAsistente;
  }

  async chat(req, res, next) {
    try {
      const { idPaciente, mensaje, historial } = req.body;
      const idNutriologo = req.nutriologo.id;

      if (!mensaje || typeof mensaje !== "string" || mensaje.trim().length === 0) {
        return res.status(400).json({ message: "El campo 'mensaje' es requerido" });
      }
      if (mensaje.length > MAX_LARGO_MENSAJE) {
        return res
          .status(400)
          .json({ message: `El mensaje no puede superar ${MAX_LARGO_MENSAJE} caracteres` });
      }

      const { respuesta, proveedor } = await this.chatAsistente.ejecutar({
        idPaciente: idPaciente ? Number(idPaciente) : null,
        mensaje: mensaje.trim(),
        historial: sanitizarHistorial(historial),
        idNutriologo,
      });

      res.json({ respuesta, proveedor });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AsistenteController;

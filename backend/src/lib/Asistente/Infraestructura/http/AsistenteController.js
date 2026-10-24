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

      const { respuesta, proveedor } = await this.chatAsistente.ejecutar({
        idPaciente: idPaciente ? Number(idPaciente) : null,
        mensaje: mensaje.trim(),
        historial: Array.isArray(historial) ? historial : [],
        idNutriologo,
      });

      res.json({ respuesta, proveedor });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AsistenteController;

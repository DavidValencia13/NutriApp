const { AppError } = require("../../Dominio/Errores");

class ReporteController {
  constructor({ obtenerReporteNutricional }) {
    this.obtenerReporteNutricional = obtenerReporteNutricional;
  }

  obtener = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const reporte = await this.obtenerReporteNutricional.ejecutar(idMenu, req.nutriologo.id);
      res.json(reporte);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  };
}

module.exports = ReporteController;

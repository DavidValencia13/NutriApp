const { AppError } = require("../../Dominio/Errores");

class RecomendacionController {
  constructor({ listarRecomendacionesPorPaciente }) {
    this.listarRecomendacionesPorPaciente = listarRecomendacionesPorPaciente;
  }

  listar = async (req, res, next) => {
    try {
      const recomendaciones = await this.listarRecomendacionesPorPaciente.ejecutar(
        req.idPaciente,
        req.nutriologo.id,
      );
      res.json(recomendaciones);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  _manejarError(error, res, next) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = RecomendacionController;

const { AppError } = require("../../Dominio/Errores");

class SugerenciaController {
  constructor({ obtenerSugerenciasMenu }) {
    this.obtenerSugerenciasMenu = obtenerSugerenciasMenu;
  }

  listar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const sugerencias = await this.obtenerSugerenciasMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(sugerencias);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  };
}

module.exports = SugerenciaController;

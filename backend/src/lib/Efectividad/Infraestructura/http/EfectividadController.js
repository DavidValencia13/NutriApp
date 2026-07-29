const { AppError } = require("../../Dominio/Errores");

class EfectividadController {
  constructor({ obtenerEfectividadMenu }) {
    this.obtenerEfectividadMenu = obtenerEfectividadMenu;
  }

  obtener = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const efectividad = await this.obtenerEfectividadMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(efectividad);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  };
}

module.exports = EfectividadController;

const { AppError } = require("../../Dominio/Errores");

class AlertaController {
  constructor({ listarAlertasPorMenu, resolverAlerta }) {
    this.listarAlertasPorMenu = listarAlertasPorMenu;
    this.resolverAlerta = resolverAlerta;
  }

  listar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const alertas = await this.listarAlertasPorMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(alertas);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  resolver = async (req, res, next) => {
    try {
      const idAlerta = Number(req.params.idAlerta);
      if (!Number.isInteger(idAlerta) || idAlerta <= 0) {
        return res.status(400).json({ message: "El id de la alerta no es válido" });
      }
      const alerta = await this.resolverAlerta.ejecutar(idAlerta, req.nutriologo.id, req.body);
      res.json(alerta);
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

module.exports = AlertaController;

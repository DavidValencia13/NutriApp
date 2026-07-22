const { AppError } = require("../../Dominio/Errores");

class MenuController {
  constructor({ generarMenuSemanal, obtenerMenuPorPaciente, ajustarComidaMenu, aprobarMenu }) {
    this.generarMenuSemanal = generarMenuSemanal;
    this.obtenerMenuPorPaciente = obtenerMenuPorPaciente;
    this.ajustarComidaMenu = ajustarComidaMenu;
    this.aprobarMenu = aprobarMenu;
  }

  generar = async (req, res, next) => {
    try {
      const menu = await this.generarMenuSemanal.ejecutar(req.idPaciente, req.nutriologo.id);
      res.status(201).json(menu);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  obtener = async (req, res, next) => {
    try {
      const menu = await this.obtenerMenuPorPaciente.ejecutar(req.idPaciente, req.nutriologo.id);
      res.json(menu);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  ajustar = async (req, res, next) => {
    try {
      const idComidaMenu = Number(req.params.idComidaMenu);
      if (!Number.isInteger(idComidaMenu) || idComidaMenu <= 0) {
        return res.status(400).json({ message: "El id de la comida no es válido" });
      }
      const comida = await this.ajustarComidaMenu.ejecutar(idComidaMenu, req.nutriologo.id, req.body);
      res.json(comida);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  aprobar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      if (!Number.isInteger(idMenu) || idMenu <= 0) {
        return res.status(400).json({ message: "El id del menú no es válido" });
      }
      const menu = await this.aprobarMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(menu);
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

module.exports = MenuController;

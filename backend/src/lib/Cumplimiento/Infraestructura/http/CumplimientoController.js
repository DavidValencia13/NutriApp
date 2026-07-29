const { AppError } = require("../../Dominio/Errores");

class CumplimientoController {
  constructor({ registrarCumplimiento, listarCumplimientoPorMenu, eliminarRegistroCumplimiento, obtenerResumenCumplimiento }) {
    this.registrarCumplimiento = registrarCumplimiento;
    this.listarCumplimientoPorMenu = listarCumplimientoPorMenu;
    this.eliminarRegistroCumplimiento = eliminarRegistroCumplimiento;
    this.obtenerResumenCumplimiento = obtenerResumenCumplimiento;
  }

  registrar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const registro = await this.registrarCumplimiento.ejecutar(
        req.nutriologo.id,
        req.idPaciente,
        idMenu,
        req.body,
      );
      res.status(201).json(registro);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  listar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const registros = await this.listarCumplimientoPorMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(registros);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  resumen = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      const resumen = await this.obtenerResumenCumplimiento.ejecutar(idMenu, req.nutriologo.id);
      res.json(resumen);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const idMenu = Number(req.params.idMenu);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "El id del registro no es válido" });
      }
      await this.eliminarRegistroCumplimiento.ejecutar(id, idMenu, req.nutriologo.id);
      res.status(204).send();
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

module.exports = CumplimientoController;

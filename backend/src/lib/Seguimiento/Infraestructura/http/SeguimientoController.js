const { AppError } = require("../../Dominio/Errores");

class SeguimientoController {
  constructor({ registrarSeguimiento, listarSeguimientoPorPaciente, eliminarSeguimiento }) {
    this.registrarSeguimiento = registrarSeguimiento;
    this.listarSeguimientoPorPaciente = listarSeguimientoPorPaciente;
    this.eliminarSeguimiento = eliminarSeguimiento;
  }

  registrar = async (req, res, next) => {
    try {
      // idPaciente viene SIEMPRE de req.idPaciente (lo puso el middleware
      // de propiedad), nunca del body — mismo criterio que Consulta.
      const { idPaciente, ...resto } = req.body;
      const registro = await this.registrarSeguimiento.ejecutar({
        ...resto,
        idPaciente: req.idPaciente,
      });
      res.status(201).json(registro);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  listar = async (req, res, next) => {
    try {
      const registros = await this.listarSeguimientoPorPaciente.ejecutar(req.idPaciente);
      res.json(registros);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "El id del registro no es válido" });
      }
      await this.eliminarSeguimiento.ejecutar(id, req.idPaciente);
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

module.exports = SeguimientoController;

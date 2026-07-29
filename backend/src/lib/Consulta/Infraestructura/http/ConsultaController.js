const { AppError } = require("../../Dominio/Errores");

class ConsultaController {
  constructor({ registrarConsulta, listarConsultasPorPaciente, eliminarConsulta }) {
    this.registrarConsulta = registrarConsulta;
    this.listarConsultasPorPaciente = listarConsultasPorPaciente;
    this.eliminarConsulta = eliminarConsulta;
  }

  registrar = async (req, res, next) => {
    try {
      // idPaciente viene SIEMPRE de req.idPaciente (lo puso el middleware
      // de propiedad), nunca del body — mismo criterio que Alimento.
      const { idPaciente, ...resto } = req.body;
      const consulta = await this.registrarConsulta.ejecutar({
        ...resto,
        idPaciente: req.idPaciente,
      });
      res.status(201).json(consulta);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  listar = async (req, res, next) => {
    try {
      const consultas = await this.listarConsultasPorPaciente.ejecutar(req.idPaciente);
      res.json(consultas);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "El id de la consulta no es válido" });
      }
      await this.eliminarConsulta.ejecutar(id, req.idPaciente);
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

module.exports = ConsultaController;

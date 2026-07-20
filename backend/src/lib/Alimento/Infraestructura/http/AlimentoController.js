const mongoose = require("mongoose");
const { AppError } = require("../../Dominio/Errores");

class AlimentoController {
  constructor({
    registrarAlimento,
    editarAlimento,
    eliminarAlimento,
    listarAlimentosPorPaciente,
  }) {
    this.registrarAlimento = registrarAlimento;
    this.editarAlimento = editarAlimento;
    this.eliminarAlimento = eliminarAlimento;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
  }

  registrar = async (req, res, next) => {
    try {
      // idPaciente viene SIEMPRE de req.idPaciente (lo puso el middleware
      // de propiedad), nunca del body — así nadie puede registrar un
      // alimento a nombre de otro paciente solo cambiando el body.
      const { idPaciente, ...resto } = req.body;
      const alimento = await this.registrarAlimento.ejecutar({
        ...resto,
        idPaciente: req.idPaciente,
      });
      res.status(201).json(alimento);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  editar = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ message: "El id del alimento no es válido" });
      }

      const { idPaciente, ...resto } = req.body; // idPaciente del body se descarta
      const alimento = await this.editarAlimento.ejecutar(
        req.params.id,
        req.idPaciente,
        resto,
      );
      res.json(alimento);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ message: "El id del alimento no es válido" });
      }

      await this.eliminarAlimento.ejecutar(req.params.id, req.idPaciente);
      res.status(204).send();
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  listar = async (req, res, next) => {
    try {
      const alimentos = await this.listarAlimentosPorPaciente.ejecutar(
        req.idPaciente,
      );
      res.json(alimentos);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  // Errores conocidos (ValidationError 400, NotFoundError 404) se responden
  // aquí mismo; cualquier otra cosa (error inesperado) se delega al error
  // handler global de app.js, que responde 500 sin filtrar detalles internos.
  _manejarError(error, res, next) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = AlimentoController;

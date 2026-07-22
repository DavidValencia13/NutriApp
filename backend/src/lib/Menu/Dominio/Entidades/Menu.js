const { ValidationError } = require("../Errores");

const ESTADOS_VALIDOS = ["generado", "aprobado"];

class Menu {
  constructor({ id, idPaciente, estado, fechaGeneracion, fechaInicio, fechaFin }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    if (!ESTADOS_VALIDOS.includes(estado))
      throw new ValidationError("El estado del menú no es válido");

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.estado = estado;
    this.fechaGeneracion = fechaGeneracion;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
  }
}

module.exports = Menu;

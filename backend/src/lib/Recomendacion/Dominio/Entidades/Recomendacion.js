const { ValidationError } = require("../Errores");

class Recomendacion {
  constructor({ id, idPaciente, texto, fechaGeneracion }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    if (!texto || texto.trim().length === 0)
      throw new ValidationError("El texto de la recomendación es requerido");

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.texto = texto.trim();
    this.fechaGeneracion = fechaGeneracion;
  }
}

module.exports = Recomendacion;

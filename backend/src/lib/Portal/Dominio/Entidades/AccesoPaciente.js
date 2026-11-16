const { ValidationError } = require("../Errores");

const LONGITUD_MINIMA_PASSWORD = 6;

// Acceso del paciente a la app: el nutriólogo le crea su correo y contraseña
// (mismas reglas que la cuenta del nutriólogo). Vive en su propia tabla para
// no mezclar credenciales con los datos clínicos del paciente.
class AccesoPaciente {
  constructor({ id, idPaciente, email, password }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    const correo = String(email || "").toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      throw new ValidationError("El correo no es válido");

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.email = correo;
    this.password = password;
  }

  static validarPassword(password) {
    if (!password || String(password).length < LONGITUD_MINIMA_PASSWORD)
      throw new ValidationError(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
  }
}

module.exports = AccesoPaciente;
module.exports.LONGITUD_MINIMA_PASSWORD = LONGITUD_MINIMA_PASSWORD;

const { ValidationError } = require("../Errores");

const NIVELES_CUMPLIMIENTO = ["bien", "regular", "mal"];

// Registro de seguimiento: bitácora simple que el nutriólogo va llenando por
// fecha para un paciente (no está ligado a un menú/día específico, a
// diferencia de Consulta que sí requiere el equipo del consultorio). Cubre
// lo mínimo pedido: peso y si la dieta se está cumpliendo bien/regular/mal,
// más una observación libre opcional.
class RegistroSeguimiento {
  constructor({ id, idPaciente, fecha, peso, nivelCumplimiento, observaciones }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    if (!NIVELES_CUMPLIMIENTO.includes(nivelCumplimiento))
      throw new ValidationError(`El nivel de cumplimiento debe ser uno de: ${NIVELES_CUMPLIMIENTO.join(", ")}`);

    if (peso !== undefined && peso !== null && (!Number.isFinite(peso) || peso <= 0))
      throw new ValidationError("El peso debe ser mayor a 0");

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.fecha = fecha || new Date();
    this.peso = peso ?? undefined;
    this.nivelCumplimiento = nivelCumplimiento;
    this.observaciones = observaciones ? observaciones.trim() : undefined;
  }
}

module.exports = RegistroSeguimiento;
module.exports.NIVELES_CUMPLIMIENTO = NIVELES_CUMPLIMIENTO;

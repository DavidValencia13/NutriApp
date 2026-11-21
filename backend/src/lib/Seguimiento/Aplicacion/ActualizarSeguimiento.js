const RegistroSeguimiento = require("../Dominio/Entidades/RegistroSeguimiento");
const { NotFoundError, ValidationError } = require("../Dominio/Errores");

class ActualizarSeguimiento {
  constructor(seguimientoRepository) {
    this.seguimientoRepository = seguimientoRepository;
  }

  async ejecutar(id, idPaciente, { peso, nivelCumplimiento, observaciones, medidas, laboratorio } = {}) {
    const existente = await this.seguimientoRepository.findByIdAndPaciente(id, idPaciente);
    if (!existente) throw new NotFoundError("Registro de seguimiento no encontrado");
    if (!Number.isFinite(peso) || peso <= 0) throw new ValidationError("El peso debe ser mayor a 0");
    if (observaciones != null && typeof observaciones !== "string") {
      throw new ValidationError("Las observaciones deben ser texto");
    }

    const registro = new RegistroSeguimiento({
      id,
      idPaciente,
      fecha: existente.fecha,
      peso,
      nivelCumplimiento,
      observaciones,
      // undefined = no se tocaron (se conservan); null = se quitaron
      medidas: medidas === undefined ? existente.medidas : medidas,
      laboratorio: laboratorio === undefined ? existente.laboratorio : laboratorio,
    });
    const actualizado = await this.seguimientoRepository.actualizar(id, idPaciente, registro);
    if (!actualizado) throw new NotFoundError("Registro de seguimiento no encontrado");
    return actualizado;
  }
}

module.exports = ActualizarSeguimiento;

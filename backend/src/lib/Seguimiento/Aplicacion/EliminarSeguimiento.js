const { NotFoundError } = require("../Dominio/Errores");

// Caso de uso: eliminar un registro de seguimiento (ej. se capturó mal).
// Es una bitácora de solo agregar/eliminar, sin edición retroactiva.
class EliminarSeguimiento {
  constructor(seguimientoRepository) {
    this.seguimientoRepository = seguimientoRepository;
  }

  async ejecutar(id, idPaciente) {
    const existente = await this.seguimientoRepository.findByIdAndPaciente(id, idPaciente);
    if (!existente) throw new NotFoundError("Registro de seguimiento no encontrado");

    return await this.seguimientoRepository.eliminar(id, idPaciente);
  }
}

module.exports = EliminarSeguimiento;

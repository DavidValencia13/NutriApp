const { NotFoundError } = require("../Dominio/Errores");

// Caso de uso: eliminar una consulta de un paciente (ej. se registró mal).
// El historial es de solo agregar/eliminar, no hay edición retroactiva.
class EliminarConsulta {
  constructor(consultaRepository) {
    this.consultaRepository = consultaRepository;
  }

  async ejecutar(id, idPaciente) {
    const existente = await this.consultaRepository.findByIdAndPaciente(id, idPaciente);
    if (!existente) throw new NotFoundError("Consulta no encontrada");

    return await this.consultaRepository.eliminar(id, idPaciente);
  }
}

module.exports = EliminarConsulta;

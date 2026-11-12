// Caso de uso: eliminar un paciente
class EliminarPaciente {
  // datosAsociados: repositorios con eliminarPorPaciente(idPaciente)
  // (alimentos, seguimiento, recomendaciones)
  constructor(pacienteRepository, datosAsociados = []) {
    this.pacienteRepository = pacienteRepository;
    this.datosAsociados = datosAsociados;
  }

  async ejecutar(id, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(id);
    if (!paciente) throw new Error("Paciente no encontrado");

    if (paciente.idNutriologo !== idNutriologo)
      throw new Error("No autorizado para eliminar este paciente");

    // Datos del paciente que la base no borra en cascada (los menús sí se
    // borran solos por la clave foránea con ON DELETE CASCADE)
    for (const repo of this.datosAsociados) {
      await repo.eliminarPorPaciente(paciente.id);
    }

    return await this.pacienteRepository.deleteById(id);
  }
}

module.exports = EliminarPaciente;
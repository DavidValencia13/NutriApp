// Caso de uso: eliminar un paciente
class EliminarPaciente {
  constructor(pacienteRepository) {
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(id, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(id);
    if (!paciente) throw new Error("Paciente no encontrado");

    if (paciente.idNutriologo !== idNutriologo)
      throw new Error("No autorizado para eliminar este paciente");

    return await this.pacienteRepository.deleteById(id);
  }
}

module.exports = EliminarPaciente;
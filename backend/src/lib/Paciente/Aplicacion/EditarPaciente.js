// Caso de uso: editar un paciente existente
class EditarPaciente {
  constructor(pacienteRepository) {
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(id, idNutriologo, data) {
    const paciente = await this.pacienteRepository.findById(id);
    if (!paciente) throw new Error("Paciente no encontrado");

    // Verifica que el paciente pertenezca al nutriólogo logueado
    // (así un nutriólogo no puede editar pacientes de otro)
    if (paciente.idNutriologo !== idNutriologo)
      throw new Error("No autorizado para editar este paciente");

    return await this.pacienteRepository.updateById(id, data);
  }
}

module.exports = EditarPaciente;
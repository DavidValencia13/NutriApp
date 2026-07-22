class ListarRecomendacionesPorPaciente {
  constructor(pacienteRepository, recomendacionRepository) {
    this.pacienteRepository = pacienteRepository;
    this.recomendacionRepository = recomendacionRepository;
  }

  async ejecutar(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new Error("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo)
      throw new Error("Paciente no encontrado");

    return await this.recomendacionRepository.listarPorPaciente(idPaciente);
  }
}

module.exports = ListarRecomendacionesPorPaciente;

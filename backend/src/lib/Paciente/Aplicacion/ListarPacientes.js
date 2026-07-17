// Caso de uso: listar todos los pacientes del nutriólogo logueado
class ListarPacientes {
  constructor(pacienteRepository) {
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(idNutriologo) {
    return await this.pacienteRepository.findAllByNutriologo(idNutriologo);
  }
}

module.exports = ListarPacientes;
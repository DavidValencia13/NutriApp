// Caso de uso: listar todos los alimentos de un paciente
class ListarAlimentosPorPaciente {
  constructor(alimentoRepository) {
    this.alimentoRepository = alimentoRepository;
  }

  async ejecutar(idPaciente) {
    return await this.alimentoRepository.findAllByPaciente(idPaciente);
  }
}

module.exports = ListarAlimentosPorPaciente;

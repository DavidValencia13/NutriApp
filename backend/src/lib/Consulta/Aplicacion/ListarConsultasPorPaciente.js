// Caso de uso: listar el historial de consultas de un paciente, en orden
// cronológico (lo que necesita el frontend para graficar evolución).
class ListarConsultasPorPaciente {
  constructor(consultaRepository) {
    this.consultaRepository = consultaRepository;
  }

  async ejecutar(idPaciente) {
    return await this.consultaRepository.listarPorPaciente(idPaciente);
  }
}

module.exports = ListarConsultasPorPaciente;

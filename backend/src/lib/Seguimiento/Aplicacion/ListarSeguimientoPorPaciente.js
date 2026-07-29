// Caso de uso: listar la bitácora de seguimiento de un paciente, en orden
// cronológico.
class ListarSeguimientoPorPaciente {
  constructor(seguimientoRepository) {
    this.seguimientoRepository = seguimientoRepository;
  }

  async ejecutar(idPaciente) {
    return await this.seguimientoRepository.listarPorPaciente(idPaciente);
  }
}

module.exports = ListarSeguimientoPorPaciente;

class IRecomendacionRepository {
  async crear(recomendacion, { contextoPersistencia } = {}) {}
  async listarPorPaciente(idPaciente) {}
}

module.exports = IRecomendacionRepository;

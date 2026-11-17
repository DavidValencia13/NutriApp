class IMenuRepository {
  async ejecutarEnTransaccion(fn) {}
  async crear(menu, dias, { contextoPersistencia }) {}
  async bloquearPaciente(idPaciente, { contextoPersistencia }) {}
  async obtenerUltimaVersionResumen(idPaciente, { contextoPersistencia } = {}) {}
  async listarVersionesPorPaciente(idPaciente) {}
  async obtenerMasRecientePorPaciente(idPaciente) {}
  async obtenerConDetallesPorId(idMenu) {}
  async obtenerMenuConPropietario(idMenu, idNutriologo) {}
  async obtenerComidaConPropietario(idComidaMenu, idNutriologo) {}
  async actualizarComida(idComidaMenu, cambios) {}
  async aprobar(idMenu) {}
}

module.exports = IMenuRepository;

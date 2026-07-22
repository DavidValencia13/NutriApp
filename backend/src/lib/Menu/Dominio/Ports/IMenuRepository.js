class IMenuRepository {
  async ejecutarEnTransaccion(fn) {}
  async crear(menu, dias, { contextoPersistencia }) {}
  async obtenerMasRecientePorPaciente(idPaciente) {}
  async obtenerMenuConPropietario(idMenu, idNutriologo) {}
  async obtenerComidaConPropietario(idComidaMenu, idNutriologo) {}
  async actualizarComida(idComidaMenu, cambios) {}
  async aprobar(idMenu) {}
}

module.exports = IMenuRepository;

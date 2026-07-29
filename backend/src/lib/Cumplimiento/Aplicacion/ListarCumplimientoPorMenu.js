const { NotFoundError } = require("../Dominio/Errores");

class ListarCumplimientoPorMenu {
  constructor({ cumplimientoRepository, menuRepository }) {
    this.cumplimientoRepository = cumplimientoRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    return await this.cumplimientoRepository.listarPorMenu(idMenu);
  }
}

module.exports = ListarCumplimientoPorMenu;

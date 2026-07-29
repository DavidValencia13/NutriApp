const { NotFoundError } = require("../Dominio/Errores");

class ListarAlertasPorMenu {
  constructor({ menuRepository, alertaRepository }) {
    this.menuRepository = menuRepository;
    this.alertaRepository = alertaRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");

    return await this.alertaRepository.listarPorMenu(idMenu);
  }
}

module.exports = ListarAlertasPorMenu;

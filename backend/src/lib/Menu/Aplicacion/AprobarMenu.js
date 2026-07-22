const { NotFoundError } = require("../Dominio/Errores");

class AprobarMenu {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");
    if (menu.estado === "aprobado") return menu;

    const aprobado = await this.menuRepository.aprobar(idMenu);
    if (!aprobado) return await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    return aprobado;
  }
}

module.exports = AprobarMenu;

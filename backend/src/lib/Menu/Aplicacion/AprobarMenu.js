const { NotFoundError } = require("../Dominio/Errores");

// Aprueba (finaliza) un menú. El nutriólogo ve las advertencias y
// sugerencias nutricionales directamente en pantalla (Sugerencia) antes de
// llegar aquí — este paso ya no vuelve a evaluarlas ni bloquea nada, es su
// decisión la que cierra el menú.
class AprobarMenu {
  constructor({ menuRepository }) {
    this.menuRepository = menuRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");
    if (menu.estado === "aprobado") return { menu };

    const aprobado = await this.menuRepository.aprobar(idMenu);
    const menuFinal =
      aprobado || (await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo));
    return { menu: menuFinal };
  }
}

module.exports = AprobarMenu;

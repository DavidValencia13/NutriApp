const { NotFoundError } = require("../Dominio/Errores");
const { calcularResumen } = require("../Dominio/Servicios/ResumenCumplimiento");

class ObtenerResumenCumplimiento {
  constructor({ cumplimientoRepository, menuRepository }) {
    this.cumplimientoRepository = cumplimientoRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const totalComidasPorDia = new Map(menu.dias.map((d) => [d.id, d.comidas.length]));

    const registros = await this.cumplimientoRepository.listarPorMenu(idMenu);
    return calcularResumen(registros, totalComidasPorDia);
  }
}

module.exports = ObtenerResumenCumplimiento;

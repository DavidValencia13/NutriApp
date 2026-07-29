const { NotFoundError } = require("../Dominio/Errores");

// El seguimiento es de solo agregar/eliminar (mismo criterio que Consulta):
// si un registro se capturó mal, se borra y se vuelve a registrar.
class EliminarRegistroCumplimiento {
  constructor({ cumplimientoRepository, menuRepository }) {
    this.cumplimientoRepository = cumplimientoRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(id, idMenu, idNutriologo) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    const existente = await this.cumplimientoRepository.findByIdAndMenu(id, idMenu);
    if (!existente) throw new NotFoundError("Registro de cumplimiento no encontrado");

    return await this.cumplimientoRepository.eliminar(id, idMenu);
  }
}

module.exports = EliminarRegistroCumplimiento;

const RegistroCumplimiento = require("../Dominio/Entidades/RegistroCumplimiento");
const { NotFoundError, ValidationError } = require("../Dominio/Errores");

// Valida que el registro corresponda a un día real de ESTE menú (idDiaMenu)
// y que las comidas marcadas como consumidas/omitidas pertenezcan a ese día
// — evita registrar cumplimiento sobre datos que no existen en el menú.
class RegistrarCumplimiento {
  constructor({ cumplimientoRepository, menuRepository }) {
    this.cumplimientoRepository = cumplimientoRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idNutriologo, idPaciente, idMenu, data) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const dia = menu.dias.find((d) => d.id === Number(data.idDiaMenu));
    if (!dia) throw new ValidationError("El día indicado no pertenece a este menú");

    const idsComidasValidas = new Set(dia.comidas.map((c) => c.id));
    for (const id of [...(data.comidasConsumidas || []), ...(data.comidasOmitidas || [])]) {
      if (!idsComidasValidas.has(Number(id)))
        throw new ValidationError("Una comida indicada no pertenece a este día del menú");
    }

    const registro = new RegistroCumplimiento({ ...data, idPaciente, idMenu });
    return await this.cumplimientoRepository.crear(registro);
  }
}

module.exports = RegistrarCumplimiento;

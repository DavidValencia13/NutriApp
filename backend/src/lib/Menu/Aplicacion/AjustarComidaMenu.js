const { NotFoundError, ConflictError, ValidationError } = require("../Dominio/Errores");

class AjustarComidaMenu {
  constructor({ menuRepository, listarAlimentosPorPaciente }) {
    this.menuRepository = menuRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
  }

  async ejecutar(idComidaMenu, idNutriologo, cambios) {
    const comida = await this.menuRepository.obtenerComidaConPropietario(idComidaMenu, idNutriologo);
    if (!comida) throw new NotFoundError("Comida no encontrada");
    if (comida.menu.estado === "aprobado")
      throw new ConflictError("No se puede ajustar un menú ya aprobado");

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(comida.menu.idPaciente);
    const alimentosPorId = new Map(alimentosDisponibles.map((a) => [a.id.toString(), a]));

    for (const detalle of cambios.alimentos) {
      if (!alimentosPorId.has(detalle.idAlimento.toString()))
        throw new ValidationError("Alimento no disponible para este paciente");
    }

    const detallesConSnapshot = cambios.alimentos.map((d) => {
      const alimento = alimentosPorId.get(d.idAlimento.toString());
      return {
        idAlimento: alimento.id.toString(),
        nombreAlimento: alimento.nombre,
        unidadMedida: alimento.unidadMedida,
        cantidadUtilizada: d.cantidad,
      };
    });

    return await this.menuRepository.actualizarComida(idComidaMenu, {
      calorias: cambios.calorias,
      alimentos: detallesConSnapshot,
    });
  }
}

module.exports = AjustarComidaMenu;

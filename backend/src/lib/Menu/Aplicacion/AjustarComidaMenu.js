const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../Dominio/Errores");

class AjustarComidaMenu {
  constructor({ menuRepository, listarAlimentosPorPaciente }) {
    this.menuRepository = menuRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
  }

  async ejecutar(idComidaMenu, idNutriologo, cambios) {
    const comida = await this.menuRepository.obtenerComidaConPropietario(
      idComidaMenu,
      idNutriologo,
    );
    if (!comida) throw new NotFoundError("Comida no encontrada");
    if (comida.menu.estado === "aprobado")
      throw new ConflictError("No se puede ajustar un menú ya aprobado");

    if (!cambios.nombrePlato || cambios.nombrePlato.trim().length === 0)
      throw new ValidationError("nombrePlato es requerido");

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(
      comida.menu.idPaciente,
    );
    const alimentosPorId = new Map(
      alimentosDisponibles.map((a) => [a.id.toString(), a]),
    );

    for (const detalle of cambios.alimentos) {
      if (!alimentosPorId.has(detalle.idAlimento.toString()))
        throw new ValidationError("Alimento no disponible para este paciente");
    }

    const detallesConSnapshot = cambios.alimentos.map((d) => {
      const alimento = alimentosPorId.get(d.idAlimento.toString());
      const precioUnitario = alimento.precio || 0;
      return {
        idAlimento: alimento.id.toString(),
        nombreAlimento: alimento.nombre,
        unidadMedida: alimento.unidadMedida,
        cantidadUtilizada: d.cantidad,
        precioUnitario,
        costoTotal: precioUnitario * d.cantidad,
      };
    });

    const costoTotal = detallesConSnapshot.reduce(
      (total, d) => total + d.costoTotal,
      0,
    );

    return await this.menuRepository.actualizarComida(idComidaMenu, {
      calorias: cambios.calorias,
      nombrePlato: cambios.nombrePlato.trim(),
      costoTotal,
      alimentos: detallesConSnapshot,
    });
  }
}

module.exports = AjustarComidaMenu;

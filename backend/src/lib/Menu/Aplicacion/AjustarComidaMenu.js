const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../Dominio/Errores");
const {
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
} = require("../Dominio/Servicios/CalculadoraNutricional");

class AjustarComidaMenu {
  constructor({ menuRepository, listarAlimentosPorPaciente, generarAlertas }) {
    this.menuRepository = menuRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.generarAlertas = generarAlertas;
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
      const alimento = alimentosPorId.get(detalle.idAlimento.toString());
      if (!alimento)
        throw new ValidationError("Alimento no disponible para este paciente");
      if (!cantidadEsPlausible(detalle.cantidad, alimento.unidadMedida))
        throw new ValidationError(
          `Cantidad poco realista para "${alimento.nombre}" (${detalle.cantidad} ${alimento.unidadMedida}) — revisa la unidad de medida`,
        );
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
        nutrientes: calcularNutrientesDetalle(alimento, d.cantidad),
      };
    });

    const costoTotal = detallesConSnapshot.reduce(
      (total, d) => total + d.costoTotal,
      0,
    );
    const nutrientes = sumarNutrientes(
      detallesConSnapshot.map((d) => d.nutrientes),
    );

    const resultado = await this.menuRepository.actualizarComida(idComidaMenu, {
      calorias: cambios.calorias,
      nombrePlato: cambios.nombrePlato.trim(),
      costoTotal,
      nutrientes,
      alimentos: detallesConSnapshot,
    });

    // Best-effort, igual criterio que en GenerarMenuSemanal: no debe tumbar
    // el ajuste ya persistido; AprobarMenu re-evalúa de todos modos.
    try {
      await this.generarAlertas.ejecutar(comida.menu.id);
    } catch (error) {
      console.error("No se pudieron regenerar alertas para el menú", comida.menu.id, ":", error.message);
    }

    return resultado;
  }
}

module.exports = AjustarComidaMenu;

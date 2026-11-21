const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../Dominio/Errores");
const {
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
  caloriasDeComida,
} = require("../Dominio/Servicios/CalculadoraNutricional");
const { actualizarPorCambios, completarNombre } = require("../Dominio/Servicios/NombrePlato");

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

    // Si cambió un alimento (acelga -> espinaca), el nombre y la
    // descripción se actualizan; y el nombre menciona todos los alimentos
    const nombresAntes = (comida.detalles || []).map((d) => d.nombreAlimento);
    const nombresDespues = detallesConSnapshot.map((d) => d.nombreAlimento);
    const nombrePlato = completarNombre(actualizarPorCambios(cambios.nombrePlato.trim(), nombresAntes, nombresDespues), nombresDespues);
    const descripcion = comida.descripcion ? actualizarPorCambios(comida.descripcion, nombresAntes, nombresDespues) : comida.descripcion;

    const resultado = await this.menuRepository.actualizarComida(idComidaMenu, {
      // Calculadas con las tablas si todos los alimentos tienen el dato; si
      // no, las que escribió el nutriólogo
      calorias: caloriasDeComida(nutrientes, cambios.calorias),
      nombrePlato,
      ...(descripcion !== undefined && { descripcion }),
      costoTotal,
      nutrientes,
      alimentos: detallesConSnapshot,
    });

    return resultado;
  }
}

module.exports = AjustarComidaMenu;

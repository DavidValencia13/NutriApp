const { NotFoundError, ValidationError } = require("../Dominio/Errores");
const { calcularNutrientesDetalle, sumarNutrientes, cantidadEsPlausible } = require("../Dominio/Servicios/CalculadoraNutricional");
const { generarParaComida } = require("../../Sugerencia/Dominio/Servicios/GeneradorSugerenciasComida");

// Calcula nutrientes y sugerencias EN VIVO mientras el nutriólogo está editando
// una comida (sin guardar). Útil para feedback inmediato sobre qué falta.
class CalcularNutrientesPreviewComida {
  constructor({ menuRepository, listarAlimentosPorPaciente, pacienteRepository }) {
    this.menuRepository = menuRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(idMenu, idNutriologo, alimentosPreview) {
    // Validar ownership del menú
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    // Obtener datos del menú y paciente
    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const paciente = await this.pacienteRepository.findById(menu.idPaciente);

    // Cargar alimentos disponibles
    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(menu.idPaciente);
    const alimentosPorId = new Map(
      alimentosDisponibles.map((a) => [a.id.toString(), a]),
    );

    // Validar alimentos del preview
    const alimentosActuales = [];
    const nutrientesDetalle = [];

    for (const item of alimentosPreview || []) {
      const alimento = alimentosPorId.get(item.idAlimento.toString());
      if (!alimento) {
        throw new ValidationError("Alimento no disponible para este paciente");
      }

      // Validar cantidad plausible
      if (!cantidadEsPlausible(item.cantidad, alimento.unidadMedida)) {
        throw new ValidationError(
          `Cantidad poco realista para "${alimento.nombre}" (${item.cantidad} ${alimento.unidadMedida})`
        );
      }

      alimentosActuales.push(alimento);
      const detalle = calcularNutrientesDetalle(alimento, item.cantidad);
      nutrientesDetalle.push(detalle);
    }

    // Sumar nutrientes de la comida parcial
    const nutrientesComida = sumarNutrientes(nutrientesDetalle);

    // Generar sugerencias basadas en lo que hay en la comida ahora
    const sugerencias = generarParaComida({
      paciente,
      alimentosActualesComida: alimentosActuales,
      alimentosDisponibles,
      nutrientesComida,
    });

    return {
      nutrientes: nutrientesComida,
      sugerencias,
    };
  }
}

module.exports = CalcularNutrientesPreviewComida;

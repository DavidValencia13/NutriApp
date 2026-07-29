const { NotFoundError } = require("../Dominio/Errores");
const { sumarNutrientes } = require("../Dominio/Servicios/CalculadoraNutricional");

// Caso de uso: historial de dietas asignadas anteriormente a un paciente
// (punto 1 del pedido original — "dietas asignadas anteriormente"). Devuelve
// un resumen liviano por menú, no el árbol completo de comidas/detalles.
class ListarMenusPorPaciente {
  constructor(pacienteRepository, menuRepository) {
    this.pacienteRepository = pacienteRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");

    const menus = await this.menuRepository.listarPorPaciente(idPaciente);

    return menus.map((menu) => ({
      id: menu.id,
      estado: menu.estado,
      fechaGeneracion: menu.fechaGeneracion,
      fechaInicio: menu.fechaInicio,
      fechaFin: menu.fechaFin,
      costoTotalSemana: menu.dias.reduce((total, d) => total + Number(d.costoTotalDia || 0), 0),
      caloriasTotalesSemana: menu.dias.reduce((total, d) => total + Number(d.caloriasTotales || 0), 0),
      resumenNutricional: sumarNutrientes(menu.dias.map((d) => d.nutrientes)),
    }));
  }
}

module.exports = ListarMenusPorPaciente;

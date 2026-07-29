const { NotFoundError } = require("../Dominio/Errores");
const { evaluar } = require("../Dominio/Servicios/EvaluadorEfectividad");
const { calcularResumen } = require("../../Seguimiento/Dominio/Servicios/ResumenSeguimiento");

class ObtenerEfectividadMenu {
  constructor({ menuRepository, pacienteRepository, alertaRepository, seguimientoRepository }) {
    this.menuRepository = menuRepository;
    this.pacienteRepository = pacienteRepository;
    this.alertaRepository = alertaRepository;
    this.seguimientoRepository = seguimientoRepository;
  }

  async ejecutar(idMenu, idNutriologo) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");

    const paciente = await this.pacienteRepository.findById(menu.idPaciente);
    const alertas = await this.alertaRepository.listarPorMenu(idMenu);
    // Seguimiento es una bitácora del paciente (no de un menú puntual), así
    // que se usan todos sus registros en vez de filtrar por idMenu.
    const registrosSeguimiento = await this.seguimientoRepository.listarPorPaciente(menu.idPaciente);
    const resumenSeguimiento = calcularResumen(registrosSeguimiento);
    // No todos los registros de seguimiento traen peso (es opcional): solo
    // los que sí lo traen sirven para la tendencia de evolución.
    const registrosPeso = registrosSeguimiento.filter((r) => r.peso !== undefined);

    return evaluar({ paciente, resumenSeguimiento, alertas, registrosPeso });
  }
}

module.exports = ObtenerEfectividadMenu;

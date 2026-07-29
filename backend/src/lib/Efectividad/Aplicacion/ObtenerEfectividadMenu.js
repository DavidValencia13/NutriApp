const { NotFoundError } = require("../Dominio/Errores");
const { evaluar } = require("../Dominio/Servicios/EvaluadorEfectividad");

class ObtenerEfectividadMenu {
  constructor({ menuRepository, pacienteRepository, alertaRepository, consultaRepository, obtenerResumenCumplimiento }) {
    this.menuRepository = menuRepository;
    this.pacienteRepository = pacienteRepository;
    this.alertaRepository = alertaRepository;
    this.consultaRepository = consultaRepository;
    this.obtenerResumenCumplimiento = obtenerResumenCumplimiento;
  }

  async ejecutar(idMenu, idNutriologo) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");

    const paciente = await this.pacienteRepository.findById(menu.idPaciente);
    const alertas = await this.alertaRepository.listarPorMenu(idMenu);
    const consultas = await this.consultaRepository.listarPorPaciente(menu.idPaciente);
    // Reutiliza el caso de uso de Cumplimiento (Fase 6): ya sabe cruzar los
    // registros contra el árbol del menú para calcular el % real.
    const resumenCumplimiento = await this.obtenerResumenCumplimiento.ejecutar(idMenu, idNutriologo);

    return evaluar({ paciente, resumenCumplimiento, alertas, consultas });
  }
}

module.exports = ObtenerEfectividadMenu;

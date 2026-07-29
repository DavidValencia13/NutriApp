const { NotFoundError } = require("../Dominio/Errores");
const { evaluar } = require("../Dominio/Servicios/EvaluadorAlertas");
const { sumarNutrientes, alimentosUsadosEnMenu } = require("../../Menu/Dominio/Servicios/CalculadoraNutricional");

// Caso de uso interno: no expone ownership propio (siempre se invoca desde
// otro caso de uso — GenerarMenuSemanal, AjustarComidaMenu, AprobarMenu —
// que ya validó que el menú pertenece al nutriólogo logueado).
class GenerarAlertas {
  constructor({ menuRepository, pacienteRepository, listarAlimentosPorPaciente, alertaRepository }) {
    this.menuRepository = menuRepository;
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.alertaRepository = alertaRepository;
  }

  async ejecutar(idMenu) {
    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    if (!menu) throw new NotFoundError("Menú no encontrado");

    const paciente = await this.pacienteRepository.findById(menu.idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(menu.idPaciente);
    const alimentosUsados = alimentosUsadosEnMenu(menu, alimentosDisponibles);

    const resumenNutricionalSemanal = sumarNutrientes(menu.dias.map((d) => d.nutrientes));

    const candidatos = evaluar({ paciente, alimentosUsados, resumenNutricionalSemanal });

    return await this.alertaRepository.upsertPendiente(idMenu, menu.idPaciente, candidatos);
  }
}

module.exports = GenerarAlertas;

const { NotFoundError } = require("../Dominio/Errores");
const { generar } = require("../Dominio/Servicios/GeneradorSugerencias");
const { sumarNutrientes, alimentosUsadosEnMenu } = require("../../Menu/Dominio/Servicios/CalculadoraNutricional");

// Igual que ListarAlertasPorMenu: valida ownership con una consulta liviana
// (obtenerMenuConPropietario) y luego trae el árbol completo por separado,
// porque obtenerMenuConPropietario no incluye dias/comidas/detalles.
class ObtenerSugerenciasMenu {
  constructor({ menuRepository, pacienteRepository, listarAlimentosPorPaciente }) {
    this.menuRepository = menuRepository;
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
  }

  async ejecutar(idMenu, idNutriologo) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const paciente = await this.pacienteRepository.findById(menu.idPaciente);

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(menu.idPaciente);
    const alimentosUsados = alimentosUsadosEnMenu(menu, alimentosDisponibles);
    const resumenNutricionalSemanal = sumarNutrientes(menu.dias.map((d) => d.nutrientes));

    return generar({ paciente, alimentosUsados, alimentosDisponibles, resumenNutricionalSemanal });
  }
}

module.exports = ObtenerSugerenciasMenu;

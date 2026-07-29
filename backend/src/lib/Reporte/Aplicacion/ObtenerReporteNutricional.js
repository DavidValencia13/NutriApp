const { NotFoundError } = require("../Dominio/Errores");
const { armar } = require("../Dominio/Servicios/ArmadorReporte");
const { sumarNutrientes } = require("../../Menu/Dominio/Servicios/CalculadoraNutricional");

// Orquesta los módulos ya existentes (Alerta, Consulta, Cumplimiento,
// Efectividad, Sugerencia, Recomendacion) para armar el reporte completo de
// un menú. Reutiliza sus casos de uso tal cual en vez de duplicar su lógica
// — el costo es un poco de sobre-consulta (cada uno vuelve a traer el árbol
// del menú), aceptable porque este es un endpoint on-demand, no un hot path.
class ObtenerReporteNutricional {
  constructor({
    menuRepository,
    pacienteRepository,
    alertaRepository,
    consultaRepository,
    recomendacionRepository,
    obtenerResumenCumplimiento,
    obtenerEfectividadMenu,
    obtenerSugerenciasMenu,
  }) {
    this.menuRepository = menuRepository;
    this.pacienteRepository = pacienteRepository;
    this.alertaRepository = alertaRepository;
    this.consultaRepository = consultaRepository;
    this.recomendacionRepository = recomendacionRepository;
    this.obtenerResumenCumplimiento = obtenerResumenCumplimiento;
    this.obtenerEfectividadMenu = obtenerEfectividadMenu;
    this.obtenerSugerenciasMenu = obtenerSugerenciasMenu;
  }

  async ejecutar(idMenu, idNutriologo) {
    const propietario = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propietario) throw new NotFoundError("Menú no encontrado");

    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const paciente = await this.pacienteRepository.findById(menu.idPaciente);
    const alertas = await this.alertaRepository.listarPorMenu(idMenu);
    const consultas = await this.consultaRepository.listarPorPaciente(menu.idPaciente);
    const resumenNutricionalSemanal = sumarNutrientes(menu.dias.map((d) => d.nutrientes));

    const [resumenCumplimiento, efectividad, sugerencias, recomendacionesGuardadas] = await Promise.all([
      this.obtenerResumenCumplimiento.ejecutar(idMenu, idNutriologo),
      this.obtenerEfectividadMenu.ejecutar(idMenu, idNutriologo),
      this.obtenerSugerenciasMenu.ejecutar(idMenu, idNutriologo),
      this.recomendacionRepository.listarPorPaciente(menu.idPaciente),
    ]);

    return armar({
      paciente,
      menu,
      resumenNutricionalSemanal,
      alertas,
      consultas,
      resumenCumplimiento,
      efectividad,
      sugerencias,
      recomendacionesGuardadas,
    });
  }
}

module.exports = ObtenerReporteNutricional;

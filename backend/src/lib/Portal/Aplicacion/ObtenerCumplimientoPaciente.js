const { resumenCumplimiento } = require("../Dominio/Servicios/ResumenCumplimiento");

// Caso de uso del nutriólogo: cómo va cumpliendo su paciente el menú
// aprobado, según lo que el paciente marca en la app
class ObtenerCumplimientoPaciente {
  constructor({ menuRepository, marcaRepository, accesoRepository }) {
    this.menuRepository = menuRepository;
    this.marcaRepository = marcaRepository;
    this.accesoRepository = accesoRepository;
  }

  async ejecutar(idPaciente) {
    const acceso = await this.accesoRepository.findByPaciente(idPaciente);
    const doc = await this.menuRepository.obtenerMasRecienteAprobadoPorPaciente(idPaciente);
    if (!doc) return { tieneAcceso: Boolean(acceso), menu: null, resumen: null };

    const menu = doc.toJSON ? doc.toJSON() : doc;
    const ids = (menu.dias || []).flatMap((d) => (d.comidas || []).map((c) => Number(c.id)));
    const marcas = await this.marcaRepository.listarPorComidas(idPaciente, ids);
    return {
      tieneAcceso: Boolean(acceso),
      menu: { id: menu.id, fechaInicio: menu.fechaInicio, fechaFin: menu.fechaFin },
      resumen: resumenCumplimiento(menu, marcas),
    };
  }
}

module.exports = ObtenerCumplimientoPaciente;

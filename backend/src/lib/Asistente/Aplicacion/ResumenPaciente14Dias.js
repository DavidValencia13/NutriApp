const { resumenCumplimiento } = require("../../Portal/Dominio/Servicios/ResumenCumplimiento");

function fechaISO(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? "" : valor.toISOString().slice(0, 10);
  const texto = String(valor || "");
  return /^\d{4}-\d{2}-\d{2}/.test(texto) ? texto.slice(0, 10) : "";
}

class ResumenPaciente14Dias {
  constructor({ seguimientoRepo, menuRepo, ingestaRepo, marcaRepo, ahora = () => new Date() }) {
    this.seguimientoRepo = seguimientoRepo;
    this.menuRepo = menuRepo;
    this.ingestaRepo = ingestaRepo;
    this.marcaRepo = marcaRepo;
    this.ahora = ahora;
  }

  async ejecutar(idPaciente) {
    const desde = new Date(this.ahora());
    desde.setDate(desde.getDate() - 14);
    const fechaDesde = desde.toISOString().slice(0, 10);
    const [controles, ingestas, versiones] = await Promise.all([
      this.seguimientoRepo.listarPorPaciente(idPaciente),
      this.ingestaRepo.listar(idPaciente),
      this.menuRepo.listarVersionesPorPaciente(idPaciente),
    ]);
    const aprobadas = (versiones || [])
      .filter((version) => version.estado === "aprobado" &&
        fechaISO(version.fechaFin || version.fechaInicio || version.fechaGeneracion) >= fechaDesde)
      .slice(0, 4);
    const menus = await Promise.all(aprobadas.map(async (version) => {
      // Los ids vienen de la consulta filtrada por paciente; no se aceptan ids del cliente.
      const doc = await this.menuRepo.obtenerConDetallesPorId(version.id);
      if (!doc) return null;
      const menu = doc.toJSON ? doc.toJSON() : doc;
      const idsComidas = (menu.dias || []).flatMap((dia) => (dia.comidas || []).map((comida) => Number(comida.id)));
      const marcas = await this.marcaRepo.listarPorComidas(idPaciente, idsComidas);
      const cumplimiento = resumenCumplimiento(menu, marcas);
      return {
        fechaInicio: fechaISO(menu.fechaInicio || version.fechaInicio),
        fechaFin: fechaISO(menu.fechaFin || version.fechaFin),
        porcentajeMarcado: cumplimiento.porcentaje,
        comidasMarcadas: cumplimiento.comidasMarcadas,
        comidasTotales: cumplimiento.comidasTotales,
        comidasQueMasSalta: cumplimiento.comidasQueMasSalta.slice(0, 3),
        platos: (menu.dias || []).slice(0, 7).flatMap((dia) =>
          (dia.comidas || []).slice(0, 6).map((comida) => comida.nombrePlato)).filter(Boolean),
      };
    }));
    return {
      desde: fechaDesde,
      controles: (controles || []).filter((registro) => fechaISO(registro.fecha) >= fechaDesde).slice(-10)
        .map((registro) => ({ fecha: fechaISO(registro.fecha), peso: registro.peso ?? null,
          nivelCumplimiento: registro.nivelCumplimiento || null })),
      ingestas: (ingestas || []).filter((ingesta) => fechaISO(ingesta.fecha) >= fechaDesde).slice(0, 20)
        .map((ingesta) => ({ fecha: fechaISO(ingesta.fecha), nombreAlimento: ingesta.nombreAlimento,
          cantidad: ingesta.cantidad, unidad: ingesta.unidad, calorias: ingesta.nutrientes?.calorias ?? null })),
      menus: menus.filter(Boolean),
    };
  }
}

module.exports = ResumenPaciente14Dias;

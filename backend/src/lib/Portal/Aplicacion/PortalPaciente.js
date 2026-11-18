const MarcaComida = require("../Dominio/Entidades/MarcaComida");
const { listaDeCompras } = require("../Dominio/Servicios/ListaCompras");
const { resumenCumplimiento } = require("../Dominio/Servicios/ResumenCumplimiento");
const { requerimientoCalorico } = require("../../Menu/Dominio/Servicios/RequerimientoCalorico");
const { NotFoundError, ValidationError } = require("../Dominio/Errores");

// Lo que el paciente hace desde su app. El paciente SOLO ve el último menú
// que su nutriólogo aprobó (nunca uno recién generado sin revisar), y solo
// puede marcar comidas de ese menú.
class PortalPaciente {
  // completarPreparacion (opcional): completa en segundo plano las
  // explicaciones de preparación que le falten al menú aprobado
  constructor({ pacienteRepository, nutriologoRepository, menuRepository, marcaRepository, seguimientoRepository, registrarSeguimiento, completarPreparacion = null }) {
    this.completarPreparacion = completarPreparacion;
    this.pacienteRepository = pacienteRepository;
    this.nutriologoRepository = nutriologoRepository;
    this.menuRepository = menuRepository;
    this.marcaRepository = marcaRepository;
    this.seguimientoRepository = seguimientoRepository;
    this.registrarSeguimiento = registrarSeguimiento;
  }

  async _paciente(idPaciente) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    return paciente;
  }

  async _menuAprobado(idPaciente) {
    const menu = await this.menuRepository.obtenerMasRecienteAprobadoPorPaciente(idPaciente);
    return menu?.toJSON ? menu.toJSON() : menu;
  }

  _idsComidas(menu) {
    return (menu?.dias || []).flatMap((d) => (d.comidas || []).map((c) => Number(c.id)));
  }

  async perfil(idPaciente) {
    const paciente = await this._paciente(idPaciente);
    const nutriologo = await this.nutriologoRepository.findById(paciente.idNutriologo);
    return {
      id: paciente.id,
      nombre: paciente.nombre,
      objetivo: paciente.objetivo,
      peso: paciente.peso,
      pesoInicial: paciente.pesoInicial,
      metaCalorias: requerimientoCalorico(paciente),
      nutriologo: nutriologo ? `${nutriologo.nombre} ${nutriologo.apellido}`.trim() : null,
      // Diseño elegido por su nutricionista (nombre de consulta, color, logo)
      marca: nutriologo?.marca || null,
    };
  }

  // Menú aprobado con lo que el paciente ya marcó en cada comida
  async menu(idPaciente) {
    const menu = await this._menuAprobado(idPaciente);
    if (!menu) return { menu: null, marcas: [] };
    this.completarPreparacion?.completarEnSegundoPlano(menu);
    const marcas = await this.marcaRepository.listarPorComidas(idPaciente, this._idsComidas(menu));
    return { menu, marcas };
  }

  async compras(idPaciente) {
    const menu = await this._menuAprobado(idPaciente);
    return { items: menu ? listaDeCompras(menu) : [] };
  }

  // estado null = quitar la marca (por si se equivocó)
  async marcarComida(idPaciente, idComidaMenu, { estado, nota }) {
    const menu = await this._menuAprobado(idPaciente);
    const id = Number(idComidaMenu);
    if (!menu || !this._idsComidas(menu).includes(id))
      throw new NotFoundError("Esa comida no está en tu menú actual");

    if (estado === null || estado === undefined || estado === "") {
      await this.marcaRepository.eliminar(idPaciente, id);
      return null;
    }
    const marca = new MarcaComida({ idPaciente, idComidaMenu: id, estado, nota });
    return await this.marcaRepository.guardar(marca);
  }

  // El peso que registra el paciente entra a la misma bitácora de
  // seguimiento que usa el nutriólogo. El nivel de cumplimiento sale de lo
  // que marcó en el menú (si todavía no marcó nada queda en "regular").
  async registrarPeso(idPaciente, { peso, nota }) {
    const kg = Number(peso);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) throw new ValidationError("Ingresa un peso válido en kg");

    const { menu, marcas } = await this.menu(idPaciente);
    const resumen = menu ? resumenCumplimiento(menu, marcas) : null;
    const partes = [
      resumen?.porcentaje !== null && resumen?.porcentaje !== undefined
        ? `Registrado por el paciente desde la app (cumplimiento del menú: ${resumen.porcentaje}%)`
        : "Registrado por el paciente desde la app (sin comidas marcadas)",
    ];
    if (nota && String(nota).trim()) partes.push(String(nota).trim().slice(0, 300));

    return await this.registrarSeguimiento.ejecutar({
      idPaciente,
      fecha: new Date(),
      peso: kg,
      nivelCumplimiento: resumen?.nivel || "regular",
      observaciones: partes.join(" · "),
    });
  }

  async progreso(idPaciente) {
    const paciente = await this._paciente(idPaciente);
    const registros = await this.seguimientoRepository.listarPorPaciente(idPaciente);
    const { menu, marcas } = await this.menu(idPaciente);
    return {
      objetivo: paciente.objetivo,
      pesoInicial: paciente.pesoInicial,
      pesoPrimerControl: registros.find((registro) => Number.isFinite(Number(registro.peso)) && Number(registro.peso) > 0)?.peso ?? null,
      registros: registros.map(({ id, fecha, peso, nivelCumplimiento }) => ({ id, fecha, peso, nivelCumplimiento })),
      cumplimiento: menu ? resumenCumplimiento(menu, marcas) : null,
    };
  }
}

module.exports = PortalPaciente;

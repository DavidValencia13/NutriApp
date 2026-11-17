const { NotFoundError, ValidationError } = require("../Dominio/Errores");

class ObtenerMenuPorPaciente {
  constructor(pacienteRepository, menuRepository) {
    this.pacienteRepository = pacienteRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idPaciente, idNutriologo) {
    await this._verificarPropietario(idPaciente, idNutriologo);
    return await this.menuRepository.obtenerMasRecientePorPaciente(idPaciente);
  }

  async listarHistorial(idPaciente, idNutriologo) {
    await this._verificarPropietario(idPaciente, idNutriologo);
    const versiones = await this.menuRepository.listarVersionesPorPaciente(idPaciente);
    const vigente = versiones.find((version) => version.estado === "aprobado")?.id;
    return versiones.map((version, indice) => ({
      ...version,
      esUltimaVersion: indice === 0,
      visibleParaPaciente: version.id === vigente,
    }));
  }

  async obtenerVersion(idPaciente, idMenu, idNutriologo) {
    await this._verificarPropietario(idPaciente, idNutriologo);
    const id = Number(idMenu);
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError("El id del menú no es válido");
    const menu = await this.menuRepository.obtenerConDetallesPorId(id);
    if (!menu || Number(menu.idPaciente) !== Number(idPaciente)) throw new NotFoundError("Menú no encontrado");
    return menu;
  }

  async _verificarPropietario(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");
  }
}

module.exports = ObtenerMenuPorPaciente;

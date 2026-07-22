const { NotFoundError } = require("../Dominio/Errores");

class ObtenerMenuPorPaciente {
  constructor(pacienteRepository, menuRepository) {
    this.pacienteRepository = pacienteRepository;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");

    return await this.menuRepository.obtenerMasRecientePorPaciente(idPaciente);
  }
}

module.exports = ObtenerMenuPorPaciente;

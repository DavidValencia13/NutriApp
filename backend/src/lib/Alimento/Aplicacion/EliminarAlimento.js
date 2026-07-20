const { NotFoundError } = require("../Dominio/Errores");

// Caso de uso: eliminar un alimento de un paciente
class EliminarAlimento {
  constructor(alimentoRepository) {
    this.alimentoRepository = alimentoRepository;
  }

  async ejecutar(id, idPaciente) {
    const existente = await this.alimentoRepository.findByIdAndPaciente(
      id,
      idPaciente,
    );
    if (!existente) throw new NotFoundError("Alimento no encontrado");

    return await this.alimentoRepository.deleteByIdAndPaciente(id, idPaciente);
  }
}

module.exports = EliminarAlimento;

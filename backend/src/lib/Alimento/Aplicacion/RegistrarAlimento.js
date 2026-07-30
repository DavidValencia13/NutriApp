const Alimento = require("../Dominio/Entidades/Alimento");
const { ConflictError } = require("../Dominio/Errores");

// Caso de uso: registrar un nuevo alimento de un paciente
class RegistrarAlimento {
  constructor(alimentoRepository) {
    this.alimentoRepository = alimentoRepository;
  }

  async ejecutar(data) {
    // La entidad ya valida los campos al construirse (ver Alimento.js)
    const alimento = new Alimento(data);
    const duplicado =
      await this.alimentoRepository.findByNombreAndPaciente(
        alimento.nombre,
        alimento.idPaciente,
      );
    if (duplicado) {
      throw new ConflictError(
        `"${alimento.nombre}" ya está registrado para este paciente. Edita el alimento existente para cambiar su cantidad o precio.`,
      );
    }
    return await this.alimentoRepository.save(alimento);
  }
}

module.exports = RegistrarAlimento;

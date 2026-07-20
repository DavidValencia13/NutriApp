const Alimento = require("../Dominio/Entidades/Alimento");

// Caso de uso: registrar un nuevo alimento de un paciente
class RegistrarAlimento {
  constructor(alimentoRepository) {
    this.alimentoRepository = alimentoRepository;
  }

  async ejecutar(data) {
    // La entidad ya valida los campos al construirse (ver Alimento.js)
    const alimento = new Alimento(data);
    return await this.alimentoRepository.save(alimento);
  }
}

module.exports = RegistrarAlimento;

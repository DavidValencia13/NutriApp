const Paciente = require("../Dominio/Entidades/Paciente");
const { validarAltura } = Paciente;

// Caso de uso: registrar un nuevo paciente
class RegistrarPaciente {
  constructor(pacienteRepository) {
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(data) {
    // La entidad ya valida los campos al construirse (ver Paciente.js)
    const paciente = new Paciente(data);
    validarAltura(paciente.altura);
    return await this.pacienteRepository.save(paciente);
  }
}

module.exports = RegistrarPaciente;
const Consulta = require("../Dominio/Entidades/Consulta");

// Caso de uso: registrar una nueva consulta (medición puntual) de un paciente
class RegistrarConsulta {
  constructor(consultaRepository) {
    this.consultaRepository = consultaRepository;
  }

  async ejecutar(data) {
    // La entidad ya valida los campos al construirse (ver Consulta.js)
    const consulta = new Consulta(data);
    return await this.consultaRepository.crear(consulta);
  }
}

module.exports = RegistrarConsulta;

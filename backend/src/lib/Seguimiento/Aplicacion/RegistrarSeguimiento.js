const RegistroSeguimiento = require("../Dominio/Entidades/RegistroSeguimiento");

// Caso de uso: registrar un nuevo punto de seguimiento (fecha, peso, nivel
// de cumplimiento) de un paciente.
class RegistrarSeguimiento {
  constructor(seguimientoRepository) {
    this.seguimientoRepository = seguimientoRepository;
  }

  async ejecutar(data) {
    // La entidad ya valida los campos al construirse (ver RegistroSeguimiento.js)
    const registro = new RegistroSeguimiento(data);
    return await this.seguimientoRepository.crear(registro);
  }
}

module.exports = RegistrarSeguimiento;

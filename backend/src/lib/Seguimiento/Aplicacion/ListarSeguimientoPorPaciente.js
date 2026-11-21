const { conComposicion } = require("../Dominio/Servicios/ComposicionCorporal");
const { evaluarLaboratorio } = require("../Dominio/Servicios/Laboratorio");

// Caso de uso: listar la bitácora de seguimiento de un paciente, en orden
// cronológico. Los controles con medidas corporales traen su composición
// (% de grasa, masa magra, IMC...) calculada con la edad, el sexo y la
// altura de la ficha del paciente.
class ListarSeguimientoPorPaciente {
  constructor(seguimientoRepository, pacienteRepository = null) {
    this.seguimientoRepository = seguimientoRepository;
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(idPaciente) {
    const registros = await this.seguimientoRepository.listarPorPaciente(idPaciente);
    if (!this.pacienteRepository || !registros.some((r) => r.medidas || r.laboratorio)) return registros;
    const paciente = (await this.pacienteRepository.findById(idPaciente)) || {};
    // Exámenes: cada valor con su estado (normal, límite, alto, bajo)
    return conComposicion(registros, paciente).map((r) => (r.laboratorio
      ? { ...r, evaluacionLaboratorio: evaluarLaboratorio(r.laboratorio, paciente.sexo) }
      : r));
  }
}

module.exports = ListarSeguimientoPorPaciente;

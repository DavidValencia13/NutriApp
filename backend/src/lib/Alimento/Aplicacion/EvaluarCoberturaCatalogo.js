const { NotFoundError } = require("../Dominio/Errores");
const { evaluar } = require("../Dominio/Servicios/EvaluadorCoberturaCatalogo");

// Caso de uso: revisar si el catálogo de alimentos de un paciente alcanza
// para armarle una dieta balanceada. Se calcula al vuelo en cada consulta
// (como Sugerencia y Efectividad, sin persistencia): es una guía que cambia
// con cada alimento que se registra, no un estado que haya que resolver.
//
// La propiedad del paciente ya la validó el middleware de la ruta
// (verificarPropietarioPaciente), igual que en el resto del módulo Alimento.
class EvaluarCoberturaCatalogo {
  constructor({ alimentoRepository, pacienteRepository }) {
    this.alimentoRepository = alimentoRepository;
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(idPaciente) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");

    const alimentos = await this.alimentoRepository.findAllByPaciente(idPaciente);
    return evaluar({ paciente, alimentos });
  }
}

module.exports = EvaluarCoberturaCatalogo;

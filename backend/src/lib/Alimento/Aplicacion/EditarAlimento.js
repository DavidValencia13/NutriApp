const Alimento = require("../Dominio/Entidades/Alimento");
const { NotFoundError } = require("../Dominio/Errores");

// Caso de uso: editar un alimento existente de un paciente
class EditarAlimento {
  constructor(alimentoRepository) {
    this.alimentoRepository = alimentoRepository;
  }

  async ejecutar(id, idPaciente, data) {
    const existente = await this.alimentoRepository.findByIdAndPaciente(
      id,
      idPaciente,
    );
    if (!existente) throw new NotFoundError("Alimento no encontrado");

    // Revalida el estado completo resultante del merge (constructor de Alimento)
    const actualizado = new Alimento({
      ...existente,
      ...data,
      id,
      idPaciente,
    });

    // Solo los campos de negocio pasan al repositorio; nunca id/idPaciente/timestamps
    const cambios = {
      nombre: actualizado.nombre,
      cantidad: actualizado.cantidad,
      unidadMedida: actualizado.unidadMedida,
    };

    return await this.alimentoRepository.updateByIdAndPaciente(
      id,
      idPaciente,
      cambios,
    );
  }
}

module.exports = EditarAlimento;

const Paciente = require("../Dominio/Entidades/Paciente");

// Caso de uso: editar un paciente existente
class EditarPaciente {
  constructor(pacienteRepository) {
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar(id, idNutriologo, data) {
    const paciente = await this.pacienteRepository.findById(id);
    if (!paciente) throw new Error("Paciente no encontrado");

    // Verifica que el paciente pertenezca al nutriólogo logueado
    // (así un nutriólogo no puede editar pacientes de otro)
    if (paciente.idNutriologo !== idNutriologo)
      throw new Error("No autorizado para editar este paciente");

    // Revalida el estado completo resultante del merge (constructor de
    // Paciente). idNutriologo siempre se toma del paciente existente, nunca
    // del body: evita que un dato colado en `data` reasigne el paciente a
    // otro nutriólogo.
    const actualizado = new Paciente({
      ...paciente,
      ...data,
      id,
      idNutriologo: paciente.idNutriologo,
    });

    // Solo campos de negocio pasan al repositorio; nunca id/idNutriologo
    const cambios = {
      nombre: actualizado.nombre,
      peso: actualizado.peso,
      altura: actualizado.altura,
      objetivo: actualizado.objetivo,
      nivelActividad: actualizado.nivelActividad,
      numeroComidas: actualizado.numeroComidas,
      presupuesto: actualizado.presupuesto,
      tiempoParaCocinar: actualizado.tiempoParaCocinar,
      restricciones: actualizado.restricciones,
      preferencias: actualizado.preferencias,
    };

    return await this.pacienteRepository.updateById(id, cambios);
  }
}

module.exports = EditarPaciente;
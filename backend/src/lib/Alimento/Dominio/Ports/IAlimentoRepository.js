// Puerto (interfaz/contrato) que define qué operaciones debe tener
// cualquier repositorio de Alimento, sin importar la base de datos que uses.
//
// Nota: no existe un findById/updateById/deleteById sin idPaciente a propósito.
// Todo acceso a un alimento concreto va siempre acompañado de su paciente dueño,
// tanto en el nombre del método como en la query final, para que no sea posible
// tocar el alimento de un paciente ajeno con solo adivinar su id.
class IAlimentoRepository {
  async save(alimento) {}
  async findByIdAndPaciente(id, idPaciente) {}
  async findAllByPaciente(idPaciente) {}
  async updateByIdAndPaciente(id, idPaciente, cambios) {}
  async deleteByIdAndPaciente(id, idPaciente) {}
}

module.exports = IAlimentoRepository;

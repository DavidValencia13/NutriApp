// Puerto (interfaz/contrato) que define qué operaciones debe tener
// cualquier repositorio de Paciente, sin importar la base de datos que uses
class IPacienteRepository {
  async save(paciente) {}
  async findById(id) {}
  async findAllByNutriologo(idNutriologo) {} // RF-004: listar solo los del nutriólogo logueado
  async updateById(id, data) {}
  async deleteById(id) {}
}

module.exports = IPacienteRepository;
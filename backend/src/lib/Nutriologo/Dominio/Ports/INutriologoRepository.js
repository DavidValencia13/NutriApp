// Puerto que define el contrato de operaciones del Nutriólogo
// La infraestructura debe implementar estos métodos
class INutriologoRepository {
  async save(nutriologo) {}
  async findById(id) {}
  async findByEmail(email) {}
  async updateById(id, data) {}
  async deleteById(id) {}
}

module.exports = INutriologoRepository;
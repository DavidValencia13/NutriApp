const Nutriologo = require("../Dominio/Entidades/Nutriologo");
const NutriologoModel = require("./NutriologoModel");

// Implementación concreta del repositorio usando PostgreSQL con Sequelize
class NutriologoRepositorySequelize {
  async save(nutriologo) {
    const doc = await NutriologoModel.create({
      nombre: nutriologo.nombre,
      apellido: nutriologo.apellido,
      email: nutriologo.email,
      password: nutriologo.password,
    });
    return this._toEntity(doc);
  }

  async findById(id) {
    const doc = await NutriologoModel.findByPk(id);
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async findByEmail(email) {
    const doc = await NutriologoModel.findOne({ where: { email } });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async updateById(id, data) {
    await NutriologoModel.update(data, { where: { id } });
    return await this.findById(id);
  }

  async deleteById(id) {
    const doc = await NutriologoModel.findByPk(id);
    if (!doc) return null;
    await doc.destroy();
    return this._toEntity(doc);
  }

  // Convierte el documento de Sequelize a entidad del dominio
  _toEntity(doc) {
    return new Nutriologo({
      id: doc.id,
      nombre: doc.nombre,
      apellido: doc.apellido,
      email: doc.email,
      password: doc.password,
    });
  }
}

module.exports = NutriologoRepositorySequelize;

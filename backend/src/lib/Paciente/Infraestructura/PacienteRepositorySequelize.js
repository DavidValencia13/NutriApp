const Paciente = require("../Dominio/Entidades/Paciente");
const PacienteModel = require("./PacienteModel");

class PacienteRepositorySequelize {
  async save(paciente) {
    const doc = await PacienteModel.create({
      idNutriologo: paciente.idNutriologo,
      nombre: paciente.nombre,
      peso: paciente.peso,
      altura: paciente.altura,
      objetivo: paciente.objetivo,
      nivelActividad: paciente.nivelActividad,
      numeroComidas: paciente.numeroComidas,
      presupuesto: paciente.presupuesto,
      tiempoParaCocinar: paciente.tiempoParaCocinar,
      restricciones: paciente.restricciones,
      preferencias: paciente.preferencias,
      alergias: paciente.alergias,
      enfermedades: paciente.enfermedades,
      pesoInicial: paciente.pesoInicial,
      edad: paciente.edad,
      sexo: paciente.sexo,
    });
    return this._toEntity(doc);
  }

  async findById(id) {
    const doc = await PacienteModel.findByPk(id);
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async findAllByNutriologo(idNutriologo) {
    const docs = await PacienteModel.findAll({ where: { idNutriologo } });
    return docs.map((doc) => this._toEntity(doc));
  }

  async updateById(id, data) {
    await PacienteModel.update(data, { where: { id } });
    return await this.findById(id);
  }

  async deleteById(id) {
    const doc = await PacienteModel.findByPk(id);
    if (!doc) return null;
    await doc.destroy();
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new Paciente({
      id: doc.id,
      idNutriologo: doc.idNutriologo,
      nombre: doc.nombre,
      peso: parseFloat(doc.peso),
      altura: parseFloat(doc.altura),
      objetivo: doc.objetivo,
      nivelActividad: doc.nivelActividad,
      numeroComidas: doc.numeroComidas,
      presupuesto: parseFloat(doc.presupuesto),
      tiempoParaCocinar: doc.tiempoParaCocinar,
      restricciones: doc.restricciones,
      preferencias: doc.preferencias,
      alergias: doc.alergias,
      enfermedades: doc.enfermedades,
      // Pacientes registrados antes de este campo tienen pesoInicial null
      // en la base; se deja undefined para que la entidad aplique su
      // default (= peso actual), en vez de convertirlo en NaN.
      pesoInicial:
        doc.pesoInicial === null || doc.pesoInicial === undefined
          ? undefined
          : parseFloat(doc.pesoInicial),
      edad: doc.edad === null ? undefined : doc.edad,
      sexo: doc.sexo === null ? undefined : doc.sexo,
    });
  }
}

module.exports = PacienteRepositorySequelize;

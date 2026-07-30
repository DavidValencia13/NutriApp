const Alimento = require("../Dominio/Entidades/Alimento");
const AlimentoModel = require("./AlimentoModel");

class AlimentoRepositoryMongo {
  async save(alimento) {
    const doc = await AlimentoModel.create({
      idPaciente: alimento.idPaciente,
      nombre: alimento.nombre,
      cantidad: alimento.cantidad,
      unidadMedida: alimento.unidadMedida,
      precio: alimento.precio,
      gruposAlimenticios: alimento.gruposAlimenticios,
      infoNutricional: alimento.infoNutricional,
    });
    return this._toEntity(doc);
  }

  async findByIdAndPaciente(id, idPaciente) {
    const doc = await AlimentoModel.findOne({ _id: id, idPaciente });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async findAllByPaciente(idPaciente) {
    const docs = await AlimentoModel.find({ idPaciente }).sort({
      createdAt: -1,
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  async findByNombreAndPaciente(nombre, idPaciente, idExcluir) {
    const filtro = { idPaciente, nombre: nombre.trim() };
    if (idExcluir) filtro._id = { $ne: idExcluir };

    const doc = await AlimentoModel.findOne(filtro).collation({
      locale: "es",
      strength: 1,
    });
    return doc ? this._toEntity(doc) : null;
  }

  async updateByIdAndPaciente(id, idPaciente, cambios) {
    // Solo nombre/cantidad/unidadMedida llegan aquí (lista blanca armada en
    // el caso de uso) — nunca se deja pasar _id/idPaciente/timestamps.
    const doc = await AlimentoModel.findOneAndUpdate(
      { _id: id, idPaciente },
      { $set: cambios },
      { new: true, runValidators: true },
    );
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async deleteByIdAndPaciente(id, idPaciente) {
    const doc = await AlimentoModel.findOneAndDelete({ _id: id, idPaciente });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new Alimento({
      id: doc._id.toString(),
      idPaciente: doc.idPaciente,
      nombre: doc.nombre,
      cantidad: doc.cantidad,
      unidadMedida: doc.unidadMedida,
      precio: doc.precio,
      gruposAlimenticios: doc.gruposAlimenticios,
      infoNutricional: doc.infoNutricional
        ? JSON.parse(JSON.stringify(doc.infoNutricional))
        : undefined,
    });
  }
}

module.exports = AlimentoRepositoryMongo;

const Recomendacion = require("../Dominio/Entidades/Recomendacion");
const RecomendacionModel = require("./RecomendacionModel");

class RecomendacionRepositorySequelize {
  async crear(recomendacion, { contextoPersistencia } = {}) {
    const doc = await RecomendacionModel.create(
      {
        idPaciente: recomendacion.idPaciente,
        texto: recomendacion.texto,
        fechaGeneracion: recomendacion.fechaGeneracion,
      },
      { transaction: contextoPersistencia },
    );
    return this._toEntity(doc);
  }

  async listarPorPaciente(idPaciente) {
    const docs = await RecomendacionModel.findAll({
      where: { idPaciente },
      order: [["fechaGeneracion", "DESC"]],
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  _toEntity(doc) {
    return new Recomendacion({
      id: doc.id,
      idPaciente: doc.idPaciente,
      texto: doc.texto,
      fechaGeneracion: doc.fechaGeneracion,
    });
  }
}

module.exports = RecomendacionRepositorySequelize;

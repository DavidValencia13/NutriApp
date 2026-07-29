const RegistroSeguimiento = require("../Dominio/Entidades/RegistroSeguimiento");
const RegistroSeguimientoModel = require("./RegistroSeguimientoModel");

class SeguimientoRepositorySequelize {
  async crear(registro) {
    const doc = await RegistroSeguimientoModel.create({
      idPaciente: registro.idPaciente,
      fecha: registro.fecha,
      peso: registro.peso,
      nivelCumplimiento: registro.nivelCumplimiento,
      observaciones: registro.observaciones,
    });
    return this._toEntity(doc);
  }

  // Orden ascendente por fecha: mismo criterio que Consulta, es el orden
  // natural para leer una bitácora en el tiempo.
  async listarPorPaciente(idPaciente) {
    const docs = await RegistroSeguimientoModel.findAll({
      where: { idPaciente },
      order: [["fecha", "ASC"]],
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  async findByIdAndPaciente(id, idPaciente) {
    const doc = await RegistroSeguimientoModel.findOne({ where: { id, idPaciente } });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async eliminar(id, idPaciente) {
    const doc = await RegistroSeguimientoModel.findOne({ where: { id, idPaciente } });
    if (!doc) return null;
    await doc.destroy();
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new RegistroSeguimiento({
      id: doc.id,
      idPaciente: doc.idPaciente,
      fecha: doc.fecha,
      peso: doc.peso === null ? undefined : parseFloat(doc.peso),
      nivelCumplimiento: doc.nivelCumplimiento,
      observaciones: doc.observaciones,
    });
  }
}

module.exports = SeguimientoRepositorySequelize;

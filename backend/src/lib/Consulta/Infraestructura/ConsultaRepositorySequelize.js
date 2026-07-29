const Consulta = require("../Dominio/Entidades/Consulta");
const ConsultaModel = require("./ConsultaModel");

class ConsultaRepositorySequelize {
  async crear(consulta) {
    const doc = await ConsultaModel.create({
      idPaciente: consulta.idPaciente,
      fecha: consulta.fecha,
      peso: consulta.peso,
      porcentajeGrasaCorporal: consulta.porcentajeGrasaCorporal,
      masaMuscular: consulta.masaMuscular,
      medidas: consulta.medidas,
      observaciones: consulta.observaciones,
      resultados: consulta.resultados,
    });
    return this._toEntity(doc);
  }

  // Orden ascendente por fecha: es el orden natural para graficar evolución.
  async listarPorPaciente(idPaciente) {
    const docs = await ConsultaModel.findAll({
      where: { idPaciente },
      order: [["fecha", "ASC"]],
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  async findByIdAndPaciente(id, idPaciente) {
    const doc = await ConsultaModel.findOne({ where: { id, idPaciente } });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async eliminar(id, idPaciente) {
    const doc = await ConsultaModel.findOne({ where: { id, idPaciente } });
    if (!doc) return null;
    await doc.destroy();
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new Consulta({
      id: doc.id,
      idPaciente: doc.idPaciente,
      fecha: doc.fecha,
      peso: parseFloat(doc.peso),
      porcentajeGrasaCorporal:
        doc.porcentajeGrasaCorporal === null ? undefined : parseFloat(doc.porcentajeGrasaCorporal),
      masaMuscular: doc.masaMuscular === null ? undefined : parseFloat(doc.masaMuscular),
      medidas: doc.medidas,
      observaciones: doc.observaciones,
      resultados: doc.resultados,
    });
  }
}

module.exports = ConsultaRepositorySequelize;

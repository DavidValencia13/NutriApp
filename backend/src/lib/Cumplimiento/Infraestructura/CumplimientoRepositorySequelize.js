const RegistroCumplimiento = require("../Dominio/Entidades/RegistroCumplimiento");
const RegistroCumplimientoModel = require("./RegistroCumplimientoModel");

class CumplimientoRepositorySequelize {
  async crear(registro) {
    const doc = await RegistroCumplimientoModel.create({
      idPaciente: registro.idPaciente,
      idMenu: registro.idMenu,
      idDiaMenu: registro.idDiaMenu,
      fecha: registro.fecha,
      comidasConsumidas: registro.comidasConsumidas,
      comidasOmitidas: registro.comidasOmitidas,
      cambiosRealizados: registro.cambiosRealizados,
      cantidadAgua: registro.cantidadAgua,
      peso: registro.peso,
      nivelHambre: registro.nivelHambre,
      nivelEnergia: registro.nivelEnergia,
      actividadFisica: registro.actividadFisica,
      sintomas: registro.sintomas,
      observaciones: registro.observaciones,
    });
    return this._toEntity(doc);
  }

  // Orden ascendente por fecha: mismo criterio que Consulta, es el orden
  // natural para revisar la evolución del cumplimiento en el resumen.
  async listarPorMenu(idMenu) {
    const docs = await RegistroCumplimientoModel.findAll({
      where: { idMenu },
      order: [["fecha", "ASC"]],
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  async findByIdAndMenu(id, idMenu) {
    const doc = await RegistroCumplimientoModel.findOne({ where: { id, idMenu } });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async eliminar(id, idMenu) {
    const doc = await RegistroCumplimientoModel.findOne({ where: { id, idMenu } });
    if (!doc) return null;
    await doc.destroy();
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new RegistroCumplimiento({
      id: doc.id,
      idPaciente: doc.idPaciente,
      idMenu: doc.idMenu,
      idDiaMenu: doc.idDiaMenu,
      fecha: doc.fecha,
      comidasConsumidas: doc.comidasConsumidas,
      comidasOmitidas: doc.comidasOmitidas,
      cambiosRealizados: doc.cambiosRealizados,
      cantidadAgua: doc.cantidadAgua === null ? undefined : parseFloat(doc.cantidadAgua),
      peso: doc.peso === null ? undefined : parseFloat(doc.peso),
      nivelHambre: doc.nivelHambre === null ? undefined : doc.nivelHambre,
      nivelEnergia: doc.nivelEnergia === null ? undefined : doc.nivelEnergia,
      actividadFisica: doc.actividadFisica,
      sintomas: doc.sintomas,
      observaciones: doc.observaciones,
    });
  }
}

module.exports = CumplimientoRepositorySequelize;

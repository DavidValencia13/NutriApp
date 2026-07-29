const Alerta = require("../Dominio/Entidades/Alerta");
const AlertaModel = require("./AlertaModel");
const { MenuModel, PacienteModel } = require("../../Menu/Infraestructura/associations");

class AlertaRepositorySequelize {
  // Por cada candidato {tipo, nivel, mensaje}: crea la fila si no existe
  // ninguna para (idMenu, tipo); si existe y sigue "pendiente", actualiza
  // nivel/mensaje in-place; si ya está resuelta, no la toca (la decisión
  // del nutriólogo queda fija para ese menú). Devuelve TODAS las alertas
  // vigentes del menú (las que siguen en la lista de candidatos + las
  // resueltas que ya no aplican no se eliminan, quedan como historial).
  async upsertPendiente(idMenu, idPaciente, candidatos) {
    for (const candidato of candidatos) {
      const existente = await AlertaModel.findOne({ where: { idMenu, tipo: candidato.tipo } });
      if (!existente) {
        await AlertaModel.create({
          idPaciente,
          idMenu,
          nivel: candidato.nivel,
          tipo: candidato.tipo,
          mensaje: candidato.mensaje,
          estado: "pendiente",
          fechaGeneracion: new Date(),
        });
      } else if (existente.estado === "pendiente") {
        await existente.update({ nivel: candidato.nivel, mensaje: candidato.mensaje });
      }
    }
    return await this.listarPorMenu(idMenu);
  }

  async listarPorMenu(idMenu) {
    const docs = await AlertaModel.findAll({
      where: { idMenu },
      order: [["fechaGeneracion", "ASC"]],
    });
    return docs.map((doc) => this._toEntity(doc));
  }

  async obtenerConPropietario(idAlerta, idNutriologo) {
    const doc = await AlertaModel.findByPk(idAlerta);
    if (!doc) return null;

    const menu = await MenuModel.findOne({
      where: { id: doc.idMenu },
      include: { model: PacienteModel, as: "paciente", where: { idNutriologo }, required: true },
    });
    if (!menu) return null;

    return this._toEntity(doc);
  }

  async resolver(idAlerta, { estado, observacion }) {
    const doc = await AlertaModel.findByPk(idAlerta);
    if (!doc) return null;
    await doc.update({ estado, observacion: observacion || null, fechaResolucion: new Date() });
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new Alerta({
      id: doc.id,
      idPaciente: doc.idPaciente,
      idMenu: doc.idMenu,
      nivel: doc.nivel,
      tipo: doc.tipo,
      mensaje: doc.mensaje,
      estado: doc.estado,
      observacion: doc.observacion,
      fechaGeneracion: doc.fechaGeneracion,
      fechaResolucion: doc.fechaResolucion,
    });
  }
}

module.exports = AlertaRepositorySequelize;

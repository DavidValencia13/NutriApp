const { Op } = require("sequelize");
const { AccesoPacienteModel, MarcaComidaModel } = require("./modelos");

class AccesoPacienteRepositorySequelize {
  _plano(doc) {
    return doc ? { id: doc.id, idPaciente: doc.idPaciente, email: doc.email, password: doc.password } : null;
  }

  async findByPaciente(idPaciente) {
    return this._plano(await AccesoPacienteModel.findOne({ where: { idPaciente } }));
  }

  async findByEmail(email) {
    return this._plano(await AccesoPacienteModel.findOne({ where: { email } }));
  }

  async guardar({ idPaciente, email, password }) {
    const existente = await AccesoPacienteModel.findOne({ where: { idPaciente } });
    if (existente) return this._plano(await existente.update({ email, password }));
    return this._plano(await AccesoPacienteModel.create({ idPaciente, email, password }));
  }

  async eliminarPorPaciente(idPaciente) {
    return (await AccesoPacienteModel.destroy({ where: { idPaciente } })) > 0;
  }
}

class MarcaComidaRepositorySequelize {
  _plano(doc) {
    return { id: doc.id, idComidaMenu: doc.idComidaMenu, estado: doc.estado, nota: doc.nota, fecha: doc.fecha };
  }

  async listarPorComidas(idPaciente, idsComidas) {
    if (!idsComidas.length) return [];
    const docs = await MarcaComidaModel.findAll({ where: { idPaciente, idComidaMenu: { [Op.in]: idsComidas } } });
    return docs.map((d) => this._plano(d));
  }

  async guardar(marca) {
    const datos = { idPaciente: marca.idPaciente, idComidaMenu: marca.idComidaMenu, estado: marca.estado, nota: marca.nota, fecha: marca.fecha };
    const existente = await MarcaComidaModel.findOne({ where: { idPaciente: marca.idPaciente, idComidaMenu: marca.idComidaMenu } });
    return this._plano(existente ? await existente.update(datos) : await MarcaComidaModel.create(datos));
  }

  async eliminar(idPaciente, idComidaMenu) {
    await MarcaComidaModel.destroy({ where: { idPaciente, idComidaMenu } });
  }
}

module.exports = { AccesoPacienteRepositorySequelize, MarcaComidaRepositorySequelize };

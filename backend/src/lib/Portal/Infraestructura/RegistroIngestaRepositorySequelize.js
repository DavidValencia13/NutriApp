const RegistroIngestaModel = require("./RegistroIngestaModel");

class RegistroIngestaRepositorySequelize {
  async listar(idPaciente) {
    const rows = await RegistroIngestaModel.findAll({
      where: { idPaciente },
      order: [["fecha", "DESC"], ["createdAt", "DESC"]],
      limit: 300,
    });
    return rows.map((row) => this.plano(row));
  }

  async guardar(datos) {
    return this.plano(await RegistroIngestaModel.create(datos));
  }

  async eliminar(idPaciente, id) {
    return (await RegistroIngestaModel.destroy({ where: { idPaciente, id } })) > 0;
  }

  plano(row) {
    return {
      id: row.id,
      fecha: row.fecha,
      nombreAlimento: row.nombreAlimento,
      cantidad: Number(row.cantidad),
      unidad: row.unidad,
      fuente: row.fuente,
      nutrientes: row.nutrientes,
    };
  }
}

module.exports = RegistroIngestaRepositorySequelize;

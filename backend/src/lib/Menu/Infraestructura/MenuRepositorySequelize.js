const { sequelize } = require("../../../Infraestructura/database/postgres");
const {
  MenuModel,
  DiaMenuModel,
  ComidaMenuModel,
  DetalleComidaAlimentoModel,
  PacienteModel,
} = require("./associations");
const Menu = require("../Dominio/Entidades/Menu");
const { NotFoundError, ConflictError } = require("../Dominio/Errores");

class MenuRepositorySequelize {
  async ejecutarEnTransaccion(fn) {
    return await sequelize.transaction(fn);
  }

  async crear({ idPaciente, estado }, dias, { contextoPersistencia }) {
    const fechaGeneracion = new Date();
    const fechaInicio = fechaGeneracion;
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 6);

    const menuDoc = await MenuModel.create(
      { idPaciente, estado, fechaGeneracion, fechaInicio, fechaFin },
      { transaction: contextoPersistencia },
    );

    for (const dia of dias) {
      const diaDoc = await DiaMenuModel.create(
        {
          idMenu: menuDoc.id,
          numeroDia: dia.numeroDia,
          caloriasTotales: dia.caloriasTotales,
        },
        { transaction: contextoPersistencia },
      );
      for (const comida of dia.comidas) {
        const comidaDoc = await ComidaMenuModel.create(
          {
            idDiaMenu: diaDoc.id,
            orden: comida.orden,
            tipoComida: comida.tipoComida,
            nombrePlato: comida.nombrePlato,
            calorias: comida.calorias,
          },
          { transaction: contextoPersistencia },
        );
        for (const detalle of comida.alimentos) {
          await DetalleComidaAlimentoModel.create(
            { idComidaMenu: comidaDoc.id, ...detalle },
            { transaction: contextoPersistencia },
          );
        }
      }
    }

    return this._toEntity(menuDoc);
  }

  async obtenerMasRecientePorPaciente(idPaciente) {
    const doc = await MenuModel.findOne({
      where: { idPaciente },
      order: [
        ["fechaGeneracion", "DESC"],
        ["id", "DESC"],
      ],
      include: {
        model: DiaMenuModel,
        as: "dias",
        include: {
          model: ComidaMenuModel,
          as: "comidas",
          include: { model: DetalleComidaAlimentoModel, as: "detalles" },
        },
      },
    });
    if (!doc) return null;

    // Sequelize no garantiza el orden de una colección hasMany incluida sin un
    // ORDER BY explícito por fila del JOIN (comprobado: sin esto, "comidas"
    // podía llegar con orden: 2 antes que orden: 1). Se ordena en memoria en
    // vez de depender de la sintaxis de "order" anidado de Sequelize, que es
    // frágil con include a varios niveles.
    doc.dias.sort((a, b) => a.numeroDia - b.numeroDia);
    for (const dia of doc.dias) {
      dia.comidas.sort((a, b) => a.orden - b.orden);
    }

    return doc; // el controller serializa el árbol completo tal cual (RF-009/RF-0010)
  }

  async obtenerMenuConPropietario(idMenu, idNutriologo) {
    const doc = await MenuModel.findOne({
      where: { id: idMenu },
      include: {
        model: PacienteModel,
        as: "paciente",
        where: { idNutriologo },
        required: true,
      },
    });
    if (!doc) return null;
    return this._toEntity(doc);
  }

  async obtenerComidaConPropietario(idComidaMenu, idNutriologo) {
    const doc = await ComidaMenuModel.findOne({
      where: { id: idComidaMenu },
      include: {
        model: DiaMenuModel,
        as: "dia",
        required: true,
        include: {
          model: MenuModel,
          as: "menu",
          required: true,
          include: {
            model: PacienteModel,
            as: "paciente",
            where: { idNutriologo },
            required: true,
          },
        },
      },
    });
    if (!doc) return null;
    return {
      id: doc.id,
      idDiaMenu: doc.idDiaMenu,
      menu: {
        id: doc.dia.menu.id,
        idPaciente: doc.dia.menu.idPaciente,
        estado: doc.dia.menu.estado,
      },
    };
  }

  async actualizarComida(idComidaMenu, cambios) {
    return await sequelize.transaction(async (transaction) => {
      const comida = await ComidaMenuModel.findOne({
        where: { id: idComidaMenu },
        include: {
          model: DiaMenuModel,
          as: "dia",
          required: true,
          include: { model: MenuModel, as: "menu" },
        },
        transaction,
      });
      if (!comida) throw new NotFoundError("Comida no encontrada");
      if (comida.dia.menu.estado !== "generado")
        throw new ConflictError("No se puede ajustar un menú ya aprobado");

      await DetalleComidaAlimentoModel.destroy({
        where: { idComidaMenu },
        transaction,
      });
      for (const detalle of cambios.alimentos) {
        await DetalleComidaAlimentoModel.create(
          { idComidaMenu, ...detalle },
          { transaction },
        );
      }
      await comida.update(
        { calorias: cambios.calorias, nombrePlato: cambios.nombrePlato },
        { transaction },
      );

      const comidasDelDia = await ComidaMenuModel.findAll({
        where: { idDiaMenu: comida.idDiaMenu },
        transaction,
      });
      const nuevoTotal = comidasDelDia.reduce(
        (total, c) => total + Number(c.calorias),
        0,
      );
      await DiaMenuModel.update(
        { caloriasTotales: nuevoTotal },
        { where: { id: comida.idDiaMenu }, transaction },
      );

      return {
        id: comida.id,
        calorias: cambios.calorias,
        nombrePlato: cambios.nombrePlato,
        alimentos: cambios.alimentos,
      };
    });
  }

  async aprobar(idMenu) {
    const [filasAfectadas] = await MenuModel.update(
      { estado: "aprobado" },
      { where: { id: idMenu, estado: "generado" } },
    );
    if (filasAfectadas === 0) return null;
    return await this._obtenerPorId(idMenu);
  }

  async _obtenerPorId(idMenu) {
    const doc = await MenuModel.findByPk(idMenu);
    if (!doc) return null;
    return this._toEntity(doc);
  }

  _toEntity(doc) {
    return new Menu({
      id: doc.id,
      idPaciente: doc.idPaciente,
      estado: doc.estado,
      fechaGeneracion: doc.fechaGeneracion,
      fechaInicio: doc.fechaInicio,
      fechaFin: doc.fechaFin,
    });
  }
}

module.exports = MenuRepositorySequelize;

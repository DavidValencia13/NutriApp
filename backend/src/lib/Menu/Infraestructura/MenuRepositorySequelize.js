const { Op } = require("sequelize");
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
const { sumarNutrientes } = require("../Dominio/Servicios/CalculadoraNutricional");

class MenuRepositorySequelize {
  async ejecutarEnTransaccion(fn) {
    return await sequelize.transaction(fn);
  }

  async bloquearPaciente(idPaciente, { contextoPersistencia }) {
    await PacienteModel.findByPk(idPaciente, {
      attributes: ["id"],
      transaction: contextoPersistencia,
      lock: contextoPersistencia.LOCK.UPDATE,
    });
  }

  async obtenerUltimaVersionResumen(idPaciente, { contextoPersistencia } = {}) {
    return await MenuModel.findOne({
      where: { idPaciente },
      attributes: ["id", "idPaciente", "estado"],
      order: [["fechaGeneracion", "DESC"], ["id", "DESC"]],
      transaction: contextoPersistencia,
    });
  }

  async listarVersionesPorPaciente(idPaciente) {
    return await MenuModel.findAll({
      where: { idPaciente },
      attributes: ["id", "estado", "fechaGeneracion", "fechaInicio", "fechaFin"],
      order: [["fechaGeneracion", "DESC"], ["id", "DESC"]],
      raw: true,
    });
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
          costoTotalDia: dia.costoTotalDia,
          nutrientes: dia.nutrientes,
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
            descripcion: comida.descripcion ?? null,
            calorias: comida.calorias,
            costoTotal: comida.costoTotal,
            nutrientes: comida.nutrientes,
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
      include: this._includeArbolCompleto(),
    });
    if (!doc) return null;
    this._ordenarArbol(doc);
    return doc; // el controller serializa el árbol completo tal cual (RF-009/RF-0010)
  }

  // Cuántos menús generó un nutriólogo (todos sus pacientes) desde una fecha
  async contarGeneradosPorNutriologoDesde(idNutriologo, desde) {
    return await MenuModel.count({
      where: { fechaGeneracion: { [Op.gte]: desde } },
      include: { model: PacienteModel, as: "paciente", where: { idNutriologo }, required: true },
    });
  }

  // Último menú APROBADO: es el único que ve el paciente en su app
  async obtenerMasRecienteAprobadoPorPaciente(idPaciente) {
    const doc = await MenuModel.findOne({
      where: { idPaciente, estado: "aprobado" },
      order: [
        ["fechaGeneracion", "DESC"],
        ["id", "DESC"],
      ],
      include: this._includeArbolCompleto(),
    });
    if (!doc) return null;
    this._ordenarArbol(doc);
    return doc;
  }

  // Igual que obtenerMasRecientePorPaciente pero por id específico — lo usa
  // Sugerencia (ObtenerSugerenciasMenu) para evaluar un menú puntual sin
  // depender de que sea "el más reciente" del paciente.
  async obtenerConDetallesPorId(idMenu) {
    const doc = await MenuModel.findOne({
      where: { id: idMenu },
      include: this._includeArbolCompleto(),
    });
    if (!doc) return null;
    this._ordenarArbol(doc);
    return doc;
  }

  _includeArbolCompleto() {
    return {
      model: DiaMenuModel,
      as: "dias",
      include: {
        model: ComidaMenuModel,
        as: "comidas",
        include: { model: DetalleComidaAlimentoModel, as: "detalles" },
      },
    };
  }

  // Sequelize no garantiza el orden de una colección hasMany incluida sin un
  // ORDER BY explícito por fila del JOIN (comprobado: sin esto, "comidas"
  // podía llegar con orden: 2 antes que orden: 1). Se ordena en memoria en
  // vez de depender de la sintaxis de "order" anidado de Sequelize, que es
  // frágil con include a varios niveles.
  _ordenarArbol(doc) {
    doc.dias.sort((a, b) => a.numeroDia - b.numeroDia);
    for (const dia of doc.dias) {
      dia.comidas.sort((a, b) => a.orden - b.orden);
    }
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
      await this.bloquearPaciente(comida.dia.menu.idPaciente, { contextoPersistencia: transaction });
      const ultimaVersion = await this.obtenerUltimaVersionResumen(comida.dia.menu.idPaciente, { contextoPersistencia: transaction });
      if (Number(ultimaVersion?.id) !== Number(comida.dia.menu.id))
        throw new ConflictError("Esta propuesta ya no es la más reciente. Abre el menú actual antes de editar.");
      if (ultimaVersion.estado !== "generado")
        throw new ConflictError("No se puede ajustar un menú ya aprobado");

      // Si cambian el plato o sus ingredientes, la explicación de
      // preparación ya no corresponde: se borra para volver a generarla
      const anteriores = await DetalleComidaAlimentoModel.findAll({ where: { idComidaMenu }, transaction });
      const idsAntes = anteriores.map((d) => String(d.idAlimento)).sort().join(",");
      const idsDespues = cambios.alimentos.map((d) => String(d.idAlimento)).sort().join(",");
      const preparacionVigente = idsAntes === idsDespues && comida.nombrePlato === cambios.nombrePlato;

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
        {
          calorias: cambios.calorias,
          nombrePlato: cambios.nombrePlato,
          costoTotal: cambios.costoTotal,
          nutrientes: cambios.nutrientes,
          ...(!preparacionVigente && { preparacion: null }),
        },
        { transaction },
      );

      const comidasDelDia = await ComidaMenuModel.findAll({
        where: { idDiaMenu: comida.idDiaMenu },
        transaction,
      });
      const nuevoTotalCalorias = comidasDelDia.reduce(
        (total, c) => total + Number(c.calorias),
        0,
      );
      const nuevoTotalCosto = comidasDelDia.reduce(
        (total, c) => total + Number(c.costoTotal),
        0,
      );
      const nuevosNutrientes = sumarNutrientes(
        comidasDelDia.map((c) => c.nutrientes),
      );
      await DiaMenuModel.update(
        {
          caloriasTotales: nuevoTotalCalorias,
          costoTotalDia: nuevoTotalCosto,
          nutrientes: nuevosNutrientes,
        },
        { where: { id: comida.idDiaMenu }, transaction },
      );

      return {
        id: comida.id,
        calorias: cambios.calorias,
        nombrePlato: cambios.nombrePlato,
        costoTotal: cambios.costoTotal,
        nutrientes: cambios.nutrientes,
        alimentos: cambios.alimentos,
      };
    });
  }

  async guardarBebida(idComidaMenu, bebida) {
    await ComidaMenuModel.update({ bebida }, { where: { id: Number(idComidaMenu) } });
  }

  // { [idComidaMenu]: preparacion | null }
  async guardarPreparaciones(porComida) {
    const entradas = Object.entries(porComida || {});
    if (entradas.length === 0) return;
    await sequelize.transaction(async (transaction) => {
      for (const [idComidaMenu, preparacion] of entradas) {
        await ComidaMenuModel.update(
          { preparacion: preparacion || null },
          { where: { id: Number(idComidaMenu) }, transaction },
        );
      }
    });
  }

  async aprobar(idMenu, { contextoPersistencia } = {}) {
    const [filasAfectadas] = await MenuModel.update(
      { estado: "aprobado" },
      { where: { id: idMenu, estado: "generado" }, transaction: contextoPersistencia },
    );
    if (filasAfectadas === 0) return null;
    return await this._obtenerPorId(idMenu, { contextoPersistencia });
  }

  async _obtenerPorId(idMenu, { contextoPersistencia } = {}) {
    const doc = await MenuModel.findByPk(idMenu, { transaction: contextoPersistencia });
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

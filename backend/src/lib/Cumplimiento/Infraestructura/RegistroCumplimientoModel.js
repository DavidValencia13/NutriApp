const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const RegistroCumplimientoModel = sequelize.define(
  "registros_cumplimiento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    idMenu: { type: DataTypes.INTEGER, allowNull: false },
    idDiaMenu: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    // Arrays de id de ComidaMenu (JSONB porque Postgres no tiene un tipo
    // "array de enteros" cómodo de usar desde Sequelize junto a JSONB en
    // otras columnas del proyecto — mismo criterio que Consulta.medidas).
    comidasConsumidas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    comidasOmitidas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    cambiosRealizados: { type: DataTypes.TEXT, allowNull: true },
    cantidadAgua: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    peso: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    nivelHambre: { type: DataTypes.INTEGER, allowNull: true },
    nivelEnergia: { type: DataTypes.INTEGER, allowNull: true },
    actividadFisica: { type: DataTypes.TEXT, allowNull: true },
    sintomas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true },
);

module.exports = RegistroCumplimientoModel;

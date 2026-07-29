const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");
const { NIVELES_CUMPLIMIENTO } = require("../Dominio/Entidades/RegistroSeguimiento");

const RegistroSeguimientoModel = sequelize.define(
  "registros_seguimiento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    peso: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    nivelCumplimiento: { type: DataTypes.ENUM(...NIVELES_CUMPLIMIENTO), allowNull: false },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true },
);

module.exports = RegistroSeguimientoModel;

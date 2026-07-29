const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const ConsultaModel = sequelize.define(
  "consultas",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    peso: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    porcentajeGrasaCorporal: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    masaMuscular: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    // { cintura, cadera, brazo, muslo, pecho, cuello } en cm, todas opcionales.
    medidas: { type: DataTypes.JSONB, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    resultados: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true },
);

module.exports = ConsultaModel;

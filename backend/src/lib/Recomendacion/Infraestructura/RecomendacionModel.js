const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const RecomendacionModel = sequelize.define(
  "recomendaciones",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    fechaGeneracion: { type: DataTypes.DATE, allowNull: false },
  },
  { timestamps: true },
);

module.exports = RecomendacionModel;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const MenuModel = sequelize.define(
  "menus",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    estado: {
      type: DataTypes.ENUM("generado", "aprobado"),
      allowNull: false,
      defaultValue: "generado",
    },
    fechaGeneracion: { type: DataTypes.DATE, allowNull: false },
    fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
    fechaFin: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["idPaciente"] },
      { fields: ["idPaciente", "fechaGeneracion"] },
    ],
  },
);

module.exports = MenuModel;

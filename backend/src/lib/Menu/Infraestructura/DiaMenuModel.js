const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const DiaMenuModel = sequelize.define(
  "dias_menu",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idMenu: { type: DataTypes.INTEGER, allowNull: false },
    numeroDia: { type: DataTypes.INTEGER, allowNull: false },
    caloriasTotales: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    costoTotalDia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["idMenu", "numeroDia"] }],
  },
);

module.exports = DiaMenuModel;

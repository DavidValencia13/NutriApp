const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const ComidaMenuModel = sequelize.define(
  "comidas_menu",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idDiaMenu: { type: DataTypes.INTEGER, allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false },
    tipoComida: { type: DataTypes.STRING, allowNull: false },
    calorias: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["idDiaMenu", "orden"] }],
  },
);

module.exports = ComidaMenuModel;

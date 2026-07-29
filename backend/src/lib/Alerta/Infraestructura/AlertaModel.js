const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const AlertaModel = sequelize.define(
  "alertas",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: { type: DataTypes.INTEGER, allowNull: false },
    idMenu: { type: DataTypes.INTEGER, allowNull: false },
    nivel: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    mensaje: { type: DataTypes.TEXT, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
    observacion: { type: DataTypes.TEXT, allowNull: true },
    fechaGeneracion: { type: DataTypes.DATE, allowNull: false },
    fechaResolucion: { type: DataTypes.DATE, allowNull: true },
  },
  {
    timestamps: true,
    // A lo sumo una fila por tipo de alerta por menú (ver AlertaRepositorySequelize.upsertPendiente):
    // una vez resuelta, esa decisión queda fija para ese menú.
    indexes: [{ unique: true, fields: ["idMenu", "tipo"] }],
  },
);

module.exports = AlertaModel;

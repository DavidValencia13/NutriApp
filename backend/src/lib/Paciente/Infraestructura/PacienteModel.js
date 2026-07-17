const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");
// (misma ruta de 3 niveles arriba que corregimos en Nutriólogo)

const PacienteModel = sequelize.define(
  "pacientes",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    idNutriologo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    peso: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    altura: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    objetivo: { type: DataTypes.STRING, allowNull: false },
    nivelActividad: { type: DataTypes.STRING, allowNull: false },
    numeroComidas: { type: DataTypes.INTEGER, allowNull: false },
    presupuesto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tiempoParaCocinar: { type: DataTypes.INTEGER, allowNull: false },
    restricciones: { type: DataTypes.TEXT, allowNull: true },
    preferencias: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true,
  },
);

module.exports = PacienteModel;
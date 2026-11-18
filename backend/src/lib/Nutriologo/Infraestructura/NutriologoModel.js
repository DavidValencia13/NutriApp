const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

// Modelo de Sequelize para PostgreSQL
// Define la tabla nutriologos y sus columnas
const NutriologoModel = sequelize.define(
  "nutriologos",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    whatsappNumero: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    // "Personalizar diseño": { nombreConsulta, color, logo } que ve el paciente
    marca: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  },
);

module.exports = NutriologoModel;

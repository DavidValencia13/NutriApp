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
    alergias: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    enfermedades: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    // Nullable a nivel de columna: los pacientes ya existentes antes de este
    // campo no tienen forma de saber cuál fue su peso al registrarse (no hay
    // sistema de migraciones para backfillear ese dato). La entidad de
    // dominio sigue garantizando el valor por defecto (= peso actual) para
    // cualquier paciente que no lo tenga, tanto al crear como al leer.
    pesoInicial: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    // Opcionales: habilitan el cálculo calórico personalizado en alertas.
    edad: { type: DataTypes.INTEGER, allowNull: true },
    sexo: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: true,
  },
);

module.exports = PacienteModel;
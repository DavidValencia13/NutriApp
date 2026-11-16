const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");
const PacienteModel = require("../../Paciente/Infraestructura/PacienteModel");

const RegistroIngestaModel = sequelize.define("registros_ingesta", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idPaciente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: PacienteModel, key: "id" },
    onDelete: "CASCADE",
  },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  nombreAlimento: { type: DataTypes.STRING(180), allowNull: false },
  cantidad: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  unidad: { type: DataTypes.STRING(2), allowNull: false },
  fuente: { type: DataTypes.STRING(20), allowNull: false },
  nutrientes: { type: DataTypes.JSONB, allowNull: false },
}, {
  timestamps: true,
  indexes: [{ fields: ["idPaciente", "fecha"] }],
});

module.exports = RegistroIngestaModel;

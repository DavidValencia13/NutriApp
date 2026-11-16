const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");
const { ESTADOS_COMIDA } = require("../Dominio/Entidades/MarcaComida");
const PacienteModel = require("../../Paciente/Infraestructura/PacienteModel");
const ComidaMenuModel = require("../../Menu/Infraestructura/ComidaMenuModel");

// Credenciales del paciente para entrar a la app. Al borrar el paciente se
// borra su acceso (ON DELETE CASCADE).
const AccesoPacienteModel = sequelize.define(
  "accesos_paciente",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: PacienteModel, key: "id" },
      onDelete: "CASCADE",
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { timestamps: true },
);

// Lo que el paciente marcó en cada comida de su menú (una marca por comida).
// Se borra con la comida o con el paciente.
const MarcaComidaModel = sequelize.define(
  "marcas_comida",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPaciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: PacienteModel, key: "id" },
      onDelete: "CASCADE",
    },
    idComidaMenu: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ComidaMenuModel, key: "id" },
      onDelete: "CASCADE",
    },
    estado: { type: DataTypes.ENUM(...ESTADOS_COMIDA), allowNull: false },
    nota: { type: DataTypes.STRING(300), allowNull: true },
    fecha: { type: DataTypes.DATE, allowNull: false },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["idPaciente", "idComidaMenu"] }],
  },
);

module.exports = { AccesoPacienteModel, MarcaComidaModel };

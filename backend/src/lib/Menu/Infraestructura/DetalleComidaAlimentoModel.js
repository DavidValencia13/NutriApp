const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const DetalleComidaAlimentoModel = sequelize.define(
  "detalle_comida_alimento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idComidaMenu: { type: DataTypes.INTEGER, allowNull: false },
    idAlimento: {
      // ObjectId de Mongo como string — NO es FK, Alimento vive en otro motor.
      // Integridad validada solo al generar/ajustar (idsPermitidos); si el
      // alimento se borra después, este registro sigue íntegro por el snapshot
      // de nombreAlimento/unidadMedida.
      type: DataTypes.STRING(24),
      allowNull: false,
      validate: { is: /^[a-fA-F0-9]{24}$/ },
    },
    nombreAlimento: { type: DataTypes.STRING(120), allowNull: false },
    unidadMedida: { type: DataTypes.STRING(30), allowNull: false },
    cantidadUtilizada: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.001 },
    },
  },
  { timestamps: true },
);

module.exports = DetalleComidaAlimentoModel;

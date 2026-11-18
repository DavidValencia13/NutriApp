const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../Infraestructura/database/postgres");

const ComidaMenuModel = sequelize.define(
  "comidas_menu",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idDiaMenu: { type: DataTypes.INTEGER, allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: false },
    tipoComida: { type: DataTypes.STRING, allowNull: false },
    nombrePlato: { type: DataTypes.STRING(150), allowNull: false },
    // Cómo se prepara y sirve el plato, en una frase (lo genera la IA)
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    calorias: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    costoTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    // Suma de nutrientes de sus detalles: { nutrientes: {...}, completo, camposFaltantes }.
    nutrientes: { type: DataTypes.JSONB, allowNull: true },
    // Explicación de preparación: { pasos: [{ accion, texto, minutos }], minutosTotales }.
    // La genera la IA a pedido del nutricionista, que la puede corregir.
    preparacion: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["idDiaMenu", "orden"] }],
  },
);

module.exports = ComidaMenuModel;

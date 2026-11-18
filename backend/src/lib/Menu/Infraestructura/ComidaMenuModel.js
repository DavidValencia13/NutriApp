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
    // Bebida que acompaña la comida (agua, agua aromática, jugo...), opcional
    bebida: { type: DataTypes.STRING(160), allowNull: true },
    // Nutrientes de la bebida si tiene calorías: { ml, nutrientes, fuente, referencia }.
    // Se suman a calorias/nutrientes de la comida (null = agua o infusión sin azúcar)
    bebidaNutricion: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["idDiaMenu", "orden"] }],
  },
);

module.exports = ComidaMenuModel;

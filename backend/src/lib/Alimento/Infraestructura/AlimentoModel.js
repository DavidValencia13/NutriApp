const mongoose = require("mongoose");
const { GRUPOS_ALIMENTICIOS } = require("../Dominio/Entidades/GruposAlimenticios");
const { CAMPOS_NUTRIENTES } = require("../Dominio/Entidades/Alimento");

// Sub-schema de nutrientes: todos opcionales (>= 0 cuando estén presentes),
// generado dinámicamente a partir de CAMPOS_NUTRIENTES para no duplicar la
// lista de 16 campos que ya vive en la entidad de dominio.
const nutrientesSchema = {};
for (const campo of CAMPOS_NUTRIENTES) {
  nutrientesSchema[campo] = {
    type: Number,
    validate: {
      validator: (v) => v === undefined || v === null || (Number.isFinite(v) && v >= 0),
      message: `${campo} debe ser un número mayor o igual a 0`,
    },
  };
}

// Modelo de Mongoose para MongoDB
// Define la colección "alimentos" y sus campos.
// Las validaciones aquí son defensa en profundidad: la entidad de dominio
// ya valida antes de llegar hasta acá, pero también se activan en updates
// gracias a runValidators: true en el repositorio.
const AlimentoSchema = new mongoose.Schema(
  {
    idPaciente: { type: Number, required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    cantidad: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isFinite(v) && v > 0,
        message: "La cantidad debe ser mayor a 0",
      },
    },
    unidadMedida: { type: String, required: true, trim: true },
    precio: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: (v) => Number.isFinite(v) && v >= 0,
        message: "El precio no puede ser negativo",
      },
    },
    gruposAlimenticios: {
      type: [String],
      required: true,
      enum: GRUPOS_ALIMENTICIOS,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "El alimento debe tener al menos un grupo alimenticio",
      },
    },
    infoNutricional: {
      _id: false,
      type: {
        refCantidad: { type: Number, default: 100 },
        refUnidad: { type: String, enum: ["g", "porcion"], default: "g" },
        gramosPorPorcion: { type: Number },
        ...nutrientesSchema,
      },
      required: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Alimento", AlimentoSchema, "alimentos");

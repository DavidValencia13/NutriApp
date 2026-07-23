const mongoose = require("mongoose");

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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Alimento", AlimentoSchema, "alimentos");

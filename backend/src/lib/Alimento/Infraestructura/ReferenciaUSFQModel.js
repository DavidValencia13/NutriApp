const mongoose = require("mongoose");
const { CAMPOS_NUTRIENTES } = require("../Dominio/Entidades/Alimento");

// Tabla de composición química de los alimentos (USFQ, 2021), extraída del
// PDF público con docs/tabla-usfq/extraer_usfq.py y cargada con
// `npm run cargar:usfq`. Valores por 100 g (o 100 ml) de porción comestible.
// Es una tabla de referencia de solo lectura: no pertenece a ningún paciente.
const nutrientesSchema = {};
for (const campo of CAMPOS_NUTRIENTES) {
  nutrientesSchema[campo] = { type: Number };
}

const ReferenciaUSFQSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    nombreIngles: { type: String },
    grupo: { type: String },
    // Tabla de donde la USFQ tomó el dato (1 = Centroamérica, 2 = USDA,
    // 7 = etiquetado nutricional, etc.); ver FUENTES en extraer_usfq.py
    codigoFuente: { type: Number },
    fuenteOriginal: { type: String },
    paginaPdf: { type: Number },
    unidadBase: { type: String, enum: ["g", "ml"], default: "g" },
    nutrientes: nutrientesSchema,
    // Nutrientes de la tabla que Alimento no maneja; se conservan para
    // consultas y comparaciones futuras
    otrosNutrientes: {
      agm_g: Number,
      agpi_g: Number,
      colesterol_mg: Number,
      fosforo_mg: Number,
      zinc_mg: Number,
      folatos_ug: Number,
    },
  },
  { versionKey: false },
);

module.exports = mongoose.model("ReferenciaUSFQ", ReferenciaUSFQSchema, "tabla_usfq");

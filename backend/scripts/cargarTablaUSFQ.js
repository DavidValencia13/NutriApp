// Carga la tabla USFQ (docs/tabla-usfq/tabla_usfq.json) en la colección
// tabla_usfq de MongoDB. Reemplaza el contenido anterior, así que se puede
// ejecutar las veces que haga falta: `npm run cargar:usfq`
require("dotenv").config();

const path = require("path");
const { connectMongo, disconnectMongo } = require("../src/Infraestructura/database/mongo");
const ReferenciaUSFQModel = require("../src/lib/Alimento/Infraestructura/ReferenciaUSFQModel");

const ARCHIVO = path.join(__dirname, "..", "..", "docs", "tabla-usfq", "tabla_usfq.json");

// Columnas de la tabla USFQ -> campos de Alimento.CAMPOS_NUTRIENTES.
// La vitamina A de la USFQ viene en µg ERE (equivalentes de retinol) y la de
// USDA en µg RAE; se guardan en el mismo campo, pero no son idénticas.
const MAPEO = {
  energia_kcal: "calorias",
  proteina_g: "proteinas",
  carbohidratos_g: "carbohidratos",
  grasa_total_g: "grasasTotales",
  ags_g: "grasasSaturadas",
  fibra_g: "fibra",
  sodio_mg: "sodio",
  potasio_mg: "potasio",
  calcio_mg: "calcio",
  hierro_mg: "hierro",
  vitamina_a_ug: "vitaminaA",
  vitamina_c_mg: "vitaminaC",
  vitamina_b12_ug: "vitaminaB12",
};
const OTROS = ["agm_g", "agpi_g", "colesterol_mg", "fosforo_mg", "zinc_mg", "folatos_ug"];

function aDocumento(fila) {
  // Celda vacía en la tabla = dato no disponible: se omite (no es 0)
  const nutrientes = {};
  for (const [col, campo] of Object.entries(MAPEO)) {
    if (fila[col] !== null && fila[col] !== undefined) nutrientes[campo] = fila[col];
  }
  const otrosNutrientes = {};
  for (const col of OTROS) {
    if (fila[col] !== null && fila[col] !== undefined) otrosNutrientes[col] = fila[col];
  }
  return {
    nombre: fila.nombre,
    nombreIngles: fila.nombre_ingles,
    grupo: fila.grupo,
    codigoFuente: fila.codigo_fuente,
    fuenteOriginal: fila.fuente,
    paginaPdf: fila.pagina_pdf,
    unidadBase: fila.grupo === "Alimentos expresados en 100 ml" ? "ml" : "g",
    nutrientes,
    otrosNutrientes,
  };
}

async function main() {
  const filas = require(ARCHIVO);
  await connectMongo();
  await ReferenciaUSFQModel.deleteMany({});
  await ReferenciaUSFQModel.insertMany(filas.map(aDocumento));
  console.log(`Tabla USFQ cargada: ${filas.length} alimentos en la colección tabla_usfq`);
}

main()
  .catch((e) => {
    console.error("No se pudo cargar la tabla USFQ:", e.message);
    process.exitCode = 1;
  })
  .finally(disconnectMongo);

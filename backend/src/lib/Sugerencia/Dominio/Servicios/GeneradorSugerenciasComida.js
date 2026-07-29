const {
  VALORES_DIARIOS_REFERENCIA,
} = require("../../../Alerta/Dominio/Servicios/ValoresReferencia");
const { normalizar } = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

const MAX_SUGERIDOS = 3;
const UMBRAL_RELEVANCIA_NUTRIENTE = 0.05;

const UNIDAD_NUTRIENTE = {
  proteinas: "g",
  fibra: "g",
  hierro: "mg",
  calcio: "mg",
  magnesio: "mg",
  potasio: "mg",
  vitaminaA: "mcg",
  vitaminaC: "mg",
  vitaminaD: "mcg",
  vitaminaB12: "mcg",
};

const MICRONUTRIENTES_GENERICOS = [
  { campo: "magnesio", label: "magnesio" },
  { campo: "potasio", label: "potasio" },
  { campo: "vitaminaA", label: "vitamina A" },
  { campo: "vitaminaC", label: "vitamina C" },
  { campo: "vitaminaD", label: "vitamina D" },
  { campo: "vitaminaB12", label: "vitamina B12" },
];

function tieneAlergia(alimento, alergias) {
  const nombreNorm = normalizar(alimento.nombre);
  return (alergias || []).some((alergia) => {
    const alergiaNorm = normalizar(alergia);
    return alergiaNorm && nombreNorm.includes(alergiaNorm);
  });
}

function candidatosPorGrupo(alimentos, grupos) {
  return alimentos.filter((a) => (a.gruposAlimenticios || []).some((g) => grupos.includes(g)));
}

function candidatosPorNutriente(alimentos, campo, umbralMinimo) {
  return alimentos
    .filter((a) => typeof a.infoNutricional?.[campo] === "number" && a.infoNutricional[campo] >= umbralMinimo)
    .sort((a, b) => b.infoNutricional[campo] - a.infoNutricional[campo]);
}

function formatoReferencia(infoNutricional) {
  if (infoNutricional.refUnidad === "porcion") {
    return `${infoNutricional.refCantidad} porción${infoNutricional.refCantidad === 1 ? "" : "es"}`;
  }
  return `${infoNutricional.refCantidad}g`;
}

function combinarCandidatos(listas, campoNutriente) {
  const vistos = new Set();
  const resultado = [];
  for (const lista of listas) {
    for (const alimento of lista) {
      const id = alimento.id.toString();
      if (vistos.has(id)) continue;
      vistos.add(id);
      const item = { id: alimento.id, nombre: alimento.nombre };
      const valor = campoNutriente ? alimento.infoNutricional?.[campoNutriente] : undefined;
      if (typeof valor === "number") {
        const unidad = UNIDAD_NUTRIENTE[campoNutriente] || "";
        item.aporte = `${valor}${unidad} por ${formatoReferencia(alimento.infoNutricional)}`;
      }
      resultado.push(item);
    }
  }
  return resultado.slice(0, MAX_SUGERIDOS);
}

// Genera sugerencias para una COMIDA en construcción (no para una semana completa).
// Evalúa qué grupos alimenticios faltan y qué nutrientes podrían ser insuficientes
// si la comida se completa tal como está.
function generarParaComida({ paciente, alimentosActualesComida, alimentosDisponibles, nutrientesComida }) {
  const sugerencias = [];
  const nutrientes = nutrientesComida?.nutrientes || {};
  const DV = VALORES_DIARIOS_REFERENCIA;

  const idsUsados = new Set((alimentosActualesComida || []).map((a) => a.id.toString()));
  const disponibles = (alimentosDisponibles || [])
    .filter((a) => !idsUsados.has(a.id.toString()))
    .filter((a) => !tieneAlergia(a, paciente.alergias));

  const gruposUsados = new Set();
  for (const alimento of alimentosActualesComida || []) {
    for (const grupo of alimento.gruposAlimenticios || []) gruposUsados.add(grupo);
  }

  function agregar(tipo, mensaje, grupos, campoNutriente) {
    const porGrupo = grupos ? candidatosPorGrupo(disponibles, grupos) : [];
    let porNutriente = [];
    if (campoNutriente) {
      const umbralMinimo = (DV[campoNutriente] || 0) * UMBRAL_RELEVANCIA_NUTRIENTE;
      porNutriente = candidatosPorNutriente(disponibles, campoNutriente, umbralMinimo);
    }
    const alimentosSugeridos = combinarCandidatos([porNutriente, porGrupo], campoNutriente);
    sugerencias.push({ tipo, mensaje, alimentosSugeridos });
  }

  // Evaluar proteínas: comparar contra 30g de referencia para una comida (DV son ~50g diarios)
  const proteinas = nutrientes.proteinas || 0;
  if (proteinas < 15) {
    agregar("proteina_baja_comida", "Podrías agregar más proteína", ["proteinas"], "proteinas");
  }

  // Evaluar fibra: comparar contra 8g por comida (DV es ~25g diarios)
  const fibra = nutrientes.fibra || 0;
  if (fibra < 5) {
    agregar(
      "fibra_baja_comida",
      "Considera agregar una fuente de fibra",
      ["legumbres", "granos_cereales", "verduras_hortalizas"],
      "fibra",
    );
  }

  // Verificar si faltan grasas saludables
  if (!gruposUsados.has("grasas_saludables")) {
    agregar("grasas_saludables_ausentes_comida", "No hay grasas saludables en esta comida", ["grasas_saludables"]);
  }

  // Verificar si faltan frutas o verduras
  if (!gruposUsados.has("frutas") && !gruposUsados.has("verduras_hortalizas")) {
    agregar("frutas_verduras_faltantes_comida", "Falta agregar frutas o verduras", ["frutas", "verduras_hortalizas"]);
  }

  // Verificar si faltan lácteos (si aplica)
  if (!gruposUsados.has("lacteos")) {
    agregar("lacteos_faltantes_comida", "Podrías agregar una fuente de lácteos o calcio", ["lacteos"]);
  }

  // Micronutrientes genéricos
  for (const { campo, label } of MICRONUTRIENTES_GENERICOS) {
    const valor = nutrientes[campo] || 0;
    if (valor < (DV[campo] || 0) * 0.3) {
      agregar(`micronutriente_bajo_comida_${campo}`, `Bajo contenido de ${label}`, null, campo);
    }
  }

  return sugerencias;
}

module.exports = { generarParaComida };

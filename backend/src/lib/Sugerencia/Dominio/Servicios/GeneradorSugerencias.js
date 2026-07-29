const {
  VALORES_DIARIOS_REFERENCIA,
} = require("../../../Alerta/Dominio/Servicios/ValoresReferencia");
const { normalizar } = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

const MAX_SUGERIDOS = 3;

// Un alimento solo califica como "fuente" de un nutriente si aporta al
// menos este % del valor diario de referencia (por su refCantidad/refUnidad
// declarada) — evita sugerir un alimento que tiene el campo cargado pero en
// una cantidad tan baja que recomendarlo no tendría sentido nutricional
// (ej. una traza de potasio no lo vuelve "fuente de potasio").
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

// Micronutrientes sin un grupo alimenticio obvio asociado: se sugiere solo
// por valor nutricional (candidatosPorNutriente), sin filtro de grupo.
const MICRONUTRIENTES_GENERICOS = [
  { campo: "magnesio", label: "magnesio" },
  { campo: "potasio", label: "potasio" },
  { campo: "vitaminaA", label: "vitamina A" },
  { campo: "vitaminaC", label: "vitamina C" },
  { campo: "vitaminaD", label: "vitamina D" },
  { campo: "vitaminaB12", label: "vitamina B12" },
];

function promedioDiario(nutrientes, campo) {
  return campo in nutrientes ? nutrientes[campo] / 7 : undefined;
}

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

// Texto de la referencia de infoNutricional (ej. "100g" o "1 porción"), para
// que el "aporte" mostrado tenga contexto (no es lo mismo 30g de proteína
// por 100g que por porción).
function formatoReferencia(infoNutricional) {
  if (infoNutricional.refUnidad === "porcion") {
    return `${infoNutricional.refCantidad} porción${infoNutricional.refCantidad === 1 ? "" : "es"}`;
  }
  return `${infoNutricional.refCantidad}g`;
}

// Junta las listas de candidatos (ya sin duplicados por id), y si se está
// evaluando un nutriente puntual, adjunta cuánto aporta cada uno — así la
// sugerencia se explica sola en vez de ser un nombre sin contexto.
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

// Analiza el estado nutricional de un menú (mismos datos que EvaluadorAlertas)
// y devuelve sugerencias de apoyo para completarlo: qué falta y qué
// alimentos del catálogo del paciente (aún no usados en el menú, y
// compatibles con sus alergias) podrían cubrir ese hueco. Función pura: no
// persiste nada, no lanza, y nunca modifica el menú — es apoyo profesional,
// la decisión final es siempre del nutriólogo (RF puntos 4 y 10).
function generar({ paciente, alimentosUsados, alimentosDisponibles, resumenNutricionalSemanal }) {
  const sugerencias = [];
  const nutrientes = resumenNutricionalSemanal?.nutrientes || {};
  const DV = VALORES_DIARIOS_REFERENCIA;

  const idsUsados = new Set((alimentosUsados || []).map((a) => a.id.toString()));
  const disponibles = (alimentosDisponibles || [])
    .filter((a) => !idsUsados.has(a.id.toString()))
    .filter((a) => !tieneAlergia(a, paciente.alergias));

  const gruposUsados = new Set();
  for (const alimento of alimentosUsados || []) {
    for (const grupo of alimento.gruposAlimenticios || []) gruposUsados.add(grupo);
  }

  function agregar(tipo, mensaje, grupos, campoNutriente) {
    const porGrupo = grupos ? candidatosPorGrupo(disponibles, grupos) : [];
    let porNutriente = [];
    if (campoNutriente) {
      const umbralMinimo = (DV[campoNutriente] || 0) * UMBRAL_RELEVANCIA_NUTRIENTE;
      porNutriente = candidatosPorNutriente(disponibles, campoNutriente, umbralMinimo);
    }
    // porNutriente primero: ya viene ordenado de mayor a menor aporte del
    // nutriente deficitario, así que prioriza el mejor candidato concreto
    // sobre el resto del grupo (que no necesariamente tiene ese dato).
    const alimentosSugeridos = combinarCandidatos([porNutriente, porGrupo], campoNutriente);
    sugerencias.push({ tipo, mensaje, alimentosSugeridos });
  }

  const proteinas = promedioDiario(nutrientes, "proteinas");
  if (proteinas !== undefined && proteinas < DV.proteinas * 0.7) {
    agregar("proteina_baja", "El menú tiene poca proteína", ["proteinas"], "proteinas");
  }

  const fibra = promedioDiario(nutrientes, "fibra");
  if (fibra !== undefined && fibra < DV.fibra * 0.7) {
    agregar(
      "fibra_baja",
      "Se recomienda añadir una fuente de fibra",
      ["legumbres", "granos_cereales", "verduras_hortalizas"],
      "fibra",
    );
  }

  if (!gruposUsados.has("grasas_saludables")) {
    agregar("grasas_saludables_ausentes", "No se han agregado grasas saludables", ["grasas_saludables"]);
  }

  const sodio = promedioDiario(nutrientes, "sodio");
  if (sodio !== undefined && sodio > DV.sodio) {
    sugerencias.push({
      tipo: "sodio_alto",
      mensaje: "La cantidad de sodio supera el valor recomendado",
      alimentosSugeridos: [],
    });
  }

  const hierro = promedioDiario(nutrientes, "hierro");
  if (hierro !== undefined && hierro < DV.hierro * 0.5) {
    agregar(
      "hierro_bajo",
      "El menú tiene un bajo contenido de hierro",
      ["proteinas", "legumbres"],
      "hierro",
    );
  }

  const calcio = promedioDiario(nutrientes, "calcio");
  if (calcio !== undefined && calcio < DV.calcio * 0.5) {
    agregar("calcio_bajo", "Se recomienda añadir una fuente de calcio", ["lacteos"], "calcio");
  }

  if (!gruposUsados.has("frutas") && !gruposUsados.has("verduras_hortalizas")) {
    agregar("frutas_verduras_faltantes", "Faltan frutas o verduras", ["frutas", "verduras_hortalizas"]);
  }

  const carbohidratos = promedioDiario(nutrientes, "carbohidratos");
  if (carbohidratos !== undefined && carbohidratos > DV.carbohidratos * 1.3) {
    sugerencias.push({
      tipo: "carbohidratos_desbalanceados",
      mensaje: "La distribución de carbohidratos no es equilibrada",
      alimentosSugeridos: [],
    });
  }

  for (const { campo, label } of MICRONUTRIENTES_GENERICOS) {
    const valor = promedioDiario(nutrientes, campo);
    if (valor !== undefined && valor < DV[campo] * 0.5) {
      agregar(`micronutriente_bajo_${campo}`, `El menú tiene un bajo contenido de ${label}`, null, campo);
    }
  }

  return sugerencias;
}

module.exports = { generar };

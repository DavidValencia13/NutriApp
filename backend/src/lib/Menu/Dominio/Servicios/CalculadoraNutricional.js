const {
  CAMPOS_NUTRIENTES,
} = require("../../../Alimento/Dominio/Entidades/Alimento");

// Conversión aproximada de la unidad de compra del alimento a gramos, para
// poder escalarla contra la referencia nutricional (por 100g o por porción).
// "ml"/"l" asumen densidad ≈ agua (1g/ml) — aproximación conocida, razonable
// para la mayoría de líquidos que se registran (leche, yogur, jugos).
const GRAMOS_POR_UNIDAD_MEDIDA = { g: 1, kg: 1000, ml: 1, l: 1000, lb: 453.592 };

// Límite razonable de "cantidad usada en UNA sola comida" por unidad de
// medida — pensado como red de seguridad contra el generador de menú por IA:
// el prompt ya le pide usar fracciones pequeñas para kg/l/lb (ej. 0.15 kg de
// pollo, no 150), pero un LLM puede ignorar esa instrucción y devolver un
// número fuera de escala (ej. "150" interpretando kg como si fueran gramos).
// Sin este límite, ese error se multiplica silenciosamente en el cálculo de
// nutrientes/costo y produce cifras absurdas (millones de kcal, cientos de
// dólares) que nadie revisaría a tiempo. No aplica a unidades desconocidas
// (se dejan pasar, no hay forma de saber qué es razonable para ellas).
const LIMITE_CANTIDAD_POR_UNIDAD = { g: 1000, ml: 1000, kg: 1.5, l: 1.5, lb: 3, unidad: 12 };

function cantidadEsPlausible(cantidad, unidadMedida) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return false;
  const limite = LIMITE_CANTIDAD_POR_UNIDAD[unidadMedida];
  return limite === undefined || cantidad <= limite;
}

// "unidad" (piezas) solo es convertible si el alimento definió su
// información nutricional "por porción": se asume 1 unidad comprada ≈ 1
// porción de referencia (ej. "1 unidad" de manzana ≈ "1 porción" de 180g).
// Si la referencia es "por 100g", no hay forma de saber cuánto pesa una
// pieza con los datos que existen hoy.
function gramosEquivalentes(cantidad, unidadMedida, infoNutricional) {
  if (unidadMedida === "unidad") {
    if (infoNutricional?.refUnidad === "porcion" && infoNutricional.gramosPorPorcion) {
      return cantidad * infoNutricional.gramosPorPorcion;
    }
    return null;
  }
  const factor = GRAMOS_POR_UNIDAD_MEDIDA[unidadMedida];
  return factor ? cantidad * factor : null;
}

// Calcula los nutrientes reales aportados por la cantidad de un alimento
// usada en una comida, escalando infoNutricional (por 100g o por porción)
// según cantidadUtilizada. Si falta infoNutricional o no se puede convertir
// la unidad a gramos, devuelve "incompleto" en vez de fallar — el llamador
// decide qué hacer con eso (ej. mostrar aviso).
function calcularNutrientesDetalle(alimento, cantidadUtilizada) {
  const infoNutricional = alimento?.infoNutricional;
  if (!infoNutricional) {
    return { nutrientes: {}, completo: false, camposFaltantes: [...CAMPOS_NUTRIENTES] };
  }

  const gramosUsados = gramosEquivalentes(
    cantidadUtilizada,
    alimento.unidadMedida,
    infoNutricional,
  );
  if (gramosUsados === null) {
    return { nutrientes: {}, completo: false, camposFaltantes: [...CAMPOS_NUTRIENTES] };
  }

  const gramosBase =
    infoNutricional.refUnidad === "porcion"
      ? infoNutricional.gramosPorPorcion * infoNutricional.refCantidad
      : infoNutricional.refCantidad;
  const factor = gramosUsados / gramosBase;

  const nutrientes = {};
  const camposFaltantes = [];
  for (const campo of CAMPOS_NUTRIENTES) {
    const valor = infoNutricional[campo];
    if (valor === undefined) {
      camposFaltantes.push(campo);
      continue;
    }
    nutrientes[campo] = valor * factor;
  }

  return { nutrientes, completo: camposFaltantes.length === 0, camposFaltantes };
}

// Agrega varios resultados de calcularNutrientesDetalle/sumarNutrientes
// (detalle→comida, comida→día, día→semana: misma forma en todos los
// niveles). "completo" solo es true si TODOS los elementos sumados lo eran.
function sumarNutrientes(listaDeResultados) {
  const nutrientes = {};
  const camposFaltantesSet = new Set();
  let completo = listaDeResultados.length > 0;

  for (const resultado of listaDeResultados) {
    if (!resultado) {
      completo = false;
      continue;
    }
    if (!resultado.completo) completo = false;
    for (const campo of resultado.camposFaltantes || []) {
      camposFaltantesSet.add(campo);
    }
    for (const [campo, valor] of Object.entries(resultado.nutrientes || {})) {
      nutrientes[campo] = (nutrientes[campo] || 0) + valor;
    }
  }

  return { nutrientes, completo, camposFaltantes: [...camposFaltantesSet] };
}

module.exports = {
  gramosEquivalentes,
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
  GRAMOS_POR_UNIDAD_MEDIDA,
  LIMITE_CANTIDAD_POR_UNIDAD,
};

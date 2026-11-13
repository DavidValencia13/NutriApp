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

// Datos indispensables para evaluar un menú. Si falta otro nutriente (ej. la
// tabla USFQ no trae azúcares, magnesio ni vitamina D) se informa en
// camposFaltantes, pero el cálculo no se marca como incompleto.
const CAMPOS_CLAVE = ["calorias", "proteinas", "carbohidratos", "grasasTotales"];

function cantidadEsPlausible(cantidad, unidadMedida) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return false;
  const limite = LIMITE_CANTIDAD_POR_UNIDAD[unidadMedida];
  return limite === undefined || cantidad <= limite;
}

// "unidad" (piezas) se convierte con gramosPorPorcion: el peso de una pieza
// (ej. 1 manzana ≈ 180 g), sea la referencia "por porción" o "por 100 g".
// Sin ese peso no hay forma de saber cuánto pesa una pieza.
function gramosEquivalentes(cantidad, unidadMedida, infoNutricional) {
  if (unidadMedida === "unidad") {
    if (infoNutricional?.gramosPorPorcion) {
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

  return {
    nutrientes,
    completo: !camposFaltantes.some((campo) => CAMPOS_CLAVE.includes(campo)),
    camposFaltantes,
  };
}

// Calorías de una comida: las calculadas con las tablas nutricionales
// (USDA/USFQ) si todos sus alimentos las tienen; si no, la estimación
// recibida (de la IA o del nutriólogo) como respaldo.
function caloriasDeComida(nutrientesSumados, estimacion) {
  const calculadas = nutrientesSumados?.nutrientes?.calorias;
  const faltan = nutrientesSumados?.camposFaltantes?.includes("calorias");
  if (Number.isFinite(calculadas) && !faltan) {
    return Math.round(calculadas);
  }
  return Number(estimacion) || 0;
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

// Deriva la lista de alimentos (con sus datos completos del catálogo) que
// aparecen usados en algún detalle del árbol de un menú (dias→comidas→
// detalles), cruzando contra el catálogo completo del paciente. Usado por
// Sugerencia (ObtenerSugerenciasMenu).
function alimentosUsadosEnMenu(menu, alimentosDisponibles) {
  const alimentosPorId = new Map(alimentosDisponibles.map((a) => [a.id.toString(), a]));
  const idsUsados = new Set();
  for (const dia of menu.dias) {
    for (const comida of dia.comidas) {
      for (const detalle of comida.detalles) idsUsados.add(detalle.idAlimento);
    }
  }
  return [...idsUsados].map((id) => alimentosPorId.get(id)).filter(Boolean);
}

// Nombre de cada comida según su lugar en el día y cuántas come el paciente.
// Lo fija el sistema (no la IA): la merienda siempre va después del almuerzo.
const MOMENTOS_POR_NUMERO_DE_COMIDAS = {
  1: ["Almuerzo"],
  2: ["Almuerzo", "Cena"],
  3: ["Desayuno", "Almuerzo", "Cena"],
  4: ["Desayuno", "Almuerzo", "Merienda", "Cena"],
  5: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"],
  6: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena", "Antes de dormir"],
};

function momentosDelDia(numeroComidas) {
  return (
    MOMENTOS_POR_NUMERO_DE_COMIDAS[numeroComidas] ||
    Array.from({ length: numeroComidas }, (_, i) => `Comida ${i + 1}`)
  );
}

// Cuántas comidas de la semana alcanza un alimento escaso, para decírselo a
// la IA (sin esto ponía yogur en todas las meriendas con solo 2 vasitos y
// había que pedir el menú otra vez). Solo para piezas, líquidos y aceites:
// los alimentos a granel (arroz, cebolla) se usan en porciones muy variables
// y el ajuste al inventario los corrige. Porción típica: una pieza (o 100 g
// de una pieza grande como lechuga o sandía), 250 ml de líquido, 10 ml de
// aceite. Devuelve null si no aplica.
function usosMaximosEnLaSemana(alimento) {
  const cantidad = Number(alimento.cantidad);
  if (!(cantidad > 0)) return null;
  const unidad = alimento.unidadMedida;
  const nombre = (alimento.nombre || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  if (/aceite|manteca|mantequilla|margarina/.test(nombre)) {
    const ml = gramosEquivalentes(cantidad, unidad, alimento.infoNutricional);
    return ml ? Math.max(1, Math.floor(ml / 10)) : null;
  }
  if (unidad === "unidad") {
    const pieza = alimento.infoNutricional?.gramosPorPorcion;
    if (pieza > 250) return Math.max(1, Math.floor((cantidad * pieza) / 100));
    return Math.max(1, Math.floor(cantidad));
  }
  if (unidad === "ml" || unidad === "l") {
    return Math.max(1, Math.floor((cantidad * GRAMOS_POR_UNIDAD_MEDIDA[unidad]) / 250));
  }
  return null;
}

module.exports = {
  usosMaximosEnLaSemana,
  caloriasDeComida,
  momentosDelDia,
  CAMPOS_CLAVE,
  gramosEquivalentes,
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
  alimentosUsadosEnMenu,
  GRAMOS_POR_UNIDAD_MEDIDA,
  LIMITE_CANTIDAD_POR_UNIDAD,
};

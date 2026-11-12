const { gramosEquivalentes } = require("../../../Menu/Dominio/Servicios/CalculadoraNutricional");
const { requerimientoCalorico } = require("../../../Menu/Dominio/Servicios/RequerimientoCalorico");
const { normalizar } = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");
const { VALORES_DIARIOS_REFERENCIA } = require("../../../Alerta/Dominio/Servicios/ValoresReferencia");

// Vitaminas, minerales y fibra que se revisan por cantidad (valor diario de
// referencia) y qué alimentos sugerir si faltan
const MICRONUTRIENTES = [
  { campo: "fibra", label: "fibra", unidad: "g", sugerencia: "verduras, frutas, menestras o avena", grupo: "verduras_hortalizas" },
  { campo: "calcio", label: "calcio", unidad: "mg", sugerencia: "leche, yogur o queso", grupo: "lacteos" },
  { campo: "hierro", label: "hierro", unidad: "mg", sugerencia: "lentejas, fréjol, carne o espinaca", grupo: "legumbres" },
  { campo: "potasio", label: "potasio", unidad: "mg", sugerencia: "papa, guineo, aguacate o naranja", grupo: "frutas" },
  { campo: "vitaminaC", label: "vitamina C", unidad: "mg", sugerencia: "naranja, guayaba, pimiento o tomate", grupo: "frutas" },
  { campo: "vitaminaA", label: "vitamina A", unidad: "µg", sugerencia: "zanahoria, zapallo, espinaca o mango", grupo: "verduras_hortalizas" },
];
// Por debajo de este % del valor diario se avisa que faltan alimentos
const PORCENTAJE_MICRONUTRIENTE = 80;

// ¿Alcanzan las CANTIDADES registradas para cubrir una semana de lo que
// necesita el paciente? La cobertura revisa grupos y nutrientes; esto revisa
// cuánto hay. Usa los mismos cálculos que el generador de menús (meta
// Mifflin-St Jeor, conversión de unidades con el peso por pieza).

const DIAS = 7;
// Aceites y grasas no se comen en cantidad: solo cuenta una porción
// realista por día (2 litros de aceite no alimentan a nadie una semana)
const GRASAS_PARA_COCINAR = /aceite|manteca|mantequilla|margarina/;
const GRAMOS_GRASA_POR_DIA = 30;

// Proteína diaria recomendada por kg de peso según el objetivo
function proteinaPorKg(objetivo) {
  const texto = normalizar(objetivo);
  if (/aument|ganar|subir|muscul|masa/.test(texto)) return 1.8;
  if (/bajar|perder|reducir|adelgazar/.test(texto)) return 1.2;
  return 1.0;
}

function evaluarSuficiencia({ paciente, alimentos }) {
  const caloriasRequeridas = requerimientoCalorico(paciente || {});
  const proteinasRequeridas = paciente?.peso > 0
    ? Math.round(Number(paciente.peso) * proteinaPorKg(paciente.objetivo))
    : null;

  let calorias = 0;
  let proteinas = 0;
  const micro = Object.fromEntries(MICRONUTRIENTES.map((m) => [m.campo, 0]));
  const sinPeso = [];
  const sinDatos = [];

  let conCantidad = 0;
  for (const alimento of alimentos || []) {
    const info = alimento.infoNutricional;
    if (!info) {
      sinDatos.push(alimento.nombre);
      continue;
    }
    let gramos = gramosEquivalentes(Number(alimento.cantidad), alimento.unidadMedida, info);
    if (gramos === null) {
      if (alimento.unidadMedida === "unidad") sinPeso.push(alimento.nombre);
      continue;
    }
    if (!Number.isFinite(gramos)) continue; // sin cantidad registrada
    conCantidad++;
    if (GRASAS_PARA_COCINAR.test(normalizar(alimento.nombre))) {
      gramos = Math.min(gramos, GRAMOS_GRASA_POR_DIA * DIAS);
    }
    const base = info.refUnidad === "porcion" ? info.gramosPorPorcion * info.refCantidad : info.refCantidad || 100;
    // Las vitaminas y minerales se suman aunque al alimento le falten calorías
    for (const m of MICRONUTRIENTES) micro[m.campo] += ((info[m.campo] || 0) * gramos) / base;
    if (info.calorias === undefined) {
      sinDatos.push(alimento.nombre);
      continue;
    }
    calorias += (info.calorias * gramos) / base;
    proteinas += ((info.proteinas || 0) * gramos) / base;
  }

  const indicador = (disponibleSemana, requeridoDia) => {
    const disponibleDia = Math.round(disponibleSemana / DIAS);
    if (!(requeridoDia > 0)) return { disponibleDia, requeridoDia: null, porcentaje: null };
    return {
      disponibleDia,
      requeridoDia,
      porcentaje: Math.round((disponibleDia / requeridoDia) * 100),
      faltaSemana: Math.max(0, Math.round(requeridoDia * DIAS - disponibleSemana)),
    };
  };

  // Sin cantidades registradas no hay nada que medir
  const micronutrientes = conCantidad === 0 ? [] : MICRONUTRIENTES.map((m) => {
    const disponibleDia = micro[m.campo] / DIAS;
    const requeridoDia = VALORES_DIARIOS_REFERENCIA[m.campo];
    return {
      campo: m.campo,
      label: m.label,
      unidad: m.unidad,
      sugerencia: m.sugerencia,
      grupo: m.grupo,
      disponibleDia: Math.round(disponibleDia * 10) / 10,
      requeridoDia,
      porcentaje: Math.round((disponibleDia / requeridoDia) * 100),
      suficiente: (disponibleDia / requeridoDia) * 100 >= PORCENTAJE_MICRONUTRIENTE,
    };
  });

  return {
    calorias: indicador(calorias, caloriasRequeridas),
    proteinas: indicador(proteinas, proteinasRequeridas),
    micronutrientes,
    alimentosSinPeso: sinPeso,
    alimentosSinDatos: sinDatos,
  };
}

// Por debajo de estos porcentajes el menú no podrá llegar a la meta
const PORCENTAJE_ADVERTENCIA = 95;
const PORCENTAJE_CRITICO = 75;

function alertasDeSuficiencia(suficiencia) {
  const alertas = [];
  const { calorias, proteinas, alimentosSinPeso } = suficiencia;

  if (calorias.porcentaje !== null && calorias.porcentaje < PORCENTAJE_ADVERTENCIA) {
    alertas.push({
      tipo: "cantidades_insuficientes_calorias",
      nivel: calorias.porcentaje < PORCENTAJE_CRITICO ? "critica" : "advertencia",
      mensaje: `Con las cantidades registradas alcanza para unas ${calorias.disponibleDia} kcal por día y el paciente necesita unas ${calorias.requeridoDia} (${calorias.porcentaje}%). Faltan unas ${calorias.faltaSemana} kcal para la semana: aumenta las cantidades o agrega alimentos energéticos (arroz, papa, avena, pan, menestra, plátano verde).`,
      grupoSugerido: "granos_cereales",
      gruposSugeridos: ["granos_cereales", "legumbres"],
    });
  }
  if (proteinas.porcentaje !== null && proteinas.porcentaje < PORCENTAJE_ADVERTENCIA) {
    alertas.push({
      tipo: "cantidades_insuficientes_proteinas",
      nivel: proteinas.porcentaje < PORCENTAJE_CRITICO ? "critica" : "advertencia",
      mensaje: `Las proteínas registradas alcanzan para unos ${proteinas.disponibleDia} g por día y el paciente necesita unos ${proteinas.requeridoDia} g (${proteinas.porcentaje}%). Agrega más pollo, huevos, pescado, carne, lácteos o menestras.`,
      grupoSugerido: "proteinas",
      gruposSugeridos: ["proteinas", "legumbres"],
    });
  }
  for (const m of suficiencia.micronutrientes || []) {
    if (m.suficiente) continue;
    alertas.push({
      tipo: `cantidades_insuficientes_${m.campo}`,
      nivel: "advertencia",
      mensaje: `Falta registrar alimentos con ${m.label}: lo registrado aporta unos ${m.disponibleDia} ${m.unidad} por día, el ${m.porcentaje}% de lo recomendado (${m.requeridoDia} ${m.unidad}). Agrega ${m.sugerencia}.`,
      grupoSugerido: m.grupo,
      gruposSugeridos: [m.grupo],
    });
  }
  if (alimentosSinPeso.length > 0) {
    alertas.push({
      tipo: "alimentos_sin_peso_por_unidad",
      nivel: "advertencia",
      mensaje: `${alimentosSinPeso.join(", ")}: se compran por unidad pero no tienen el peso de una pieza, así que no se pueden calcular sus nutrientes. Edítalos y completa "Peso aproximado de 1 unidad".`,
      gruposSugeridos: [],
    });
  }
  return alertas;
}

module.exports = { evaluarSuficiencia, alertasDeSuficiencia, proteinaPorKg };

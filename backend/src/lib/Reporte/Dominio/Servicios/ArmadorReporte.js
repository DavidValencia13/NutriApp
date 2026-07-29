// Tipos de alerta (ver Alerta/Dominio/Servicios/EvaluadorAlertas.js) que
// tratan directamente sobre un valor nutricional, para separarlas del resto
// (alergias, enfermedades, variedad, datos faltantes) en la sección
// "nutrientes deficientes o excesivos" del reporte.
const TIPOS_ALERTA_NUTRIENTE = [
  "proteina_insuficiente",
  "carbohidratos_exceso",
  "grasas_saturadas_exceso",
  "fibra_insuficiente",
  "sodio_exceso",
  "calorias_fuera_de_rango_seguro",
  "calorias_desviadas_objetivo",
];

function esAlertaDeNutriente(tipo) {
  return TIPOS_ALERTA_NUTRIENTE.includes(tipo) || tipo.startsWith("micronutriente_bajo_");
}

// % de las calorías totales que aporta cada macronutriente (4 kcal/g
// proteína y carbohidratos, 9 kcal/g grasa) — es la forma habitual de leer
// "distribución de macronutrientes", más útil que los gramos crudos para
// juzgar si una dieta está balanceada. null si faltan datos (no se inventa
// un porcentaje con información incompleta).
function calcularDistribucionMacros(nutrientes) {
  const proteinas = nutrientes?.proteinas;
  const carbohidratos = nutrientes?.carbohidratos;
  const grasasTotales = nutrientes?.grasasTotales;
  if (proteinas === undefined || carbohidratos === undefined || grasasTotales === undefined) return null;

  const calProteinas = proteinas * 4;
  const calCarbohidratos = carbohidratos * 4;
  const calGrasas = grasasTotales * 9;
  const calTotal = calProteinas + calCarbohidratos + calGrasas;
  if (calTotal <= 0) return null;

  return {
    proteinasPorcentaje: Math.round((calProteinas / calTotal) * 100),
    carbohidratosPorcentaje: Math.round((calCarbohidratos / calTotal) * 100),
    grasasPorcentaje: Math.round((calGrasas / calTotal) * 100),
  };
}

// Ensambla el reporte nutricional final a partir de piezas ya calculadas por
// los módulos existentes (Alerta, Consulta, Cumplimiento, Efectividad,
// Sugerencia, Recomendacion) — el reporte no inventa análisis nuevos, solo
// los reúne en un solo documento legible (RF punto 9). Función pura: recibe
// todo ya resuelto, no consulta nada ni lanza.
function armar({
  paciente,
  menu,
  resumenNutricionalSemanal,
  alertas,
  consultas,
  resumenCumplimiento,
  efectividad,
  sugerencias,
  recomendacionesGuardadas,
}) {
  const nutrientesDeficientesOExcesivos = (alertas || []).filter((a) => esAlertaDeNutriente(a.tipo));

  const pesoInicial = paciente.pesoInicial;
  const pesoActual = consultas && consultas.length > 0 ? consultas[consultas.length - 1].peso : paciente.peso;
  const deltaPesoKg =
    pesoInicial !== undefined && pesoActual !== undefined
      ? Number((pesoActual - pesoInicial).toFixed(2))
      : undefined;

  // "Recomendaciones para la siguiente consulta": no es contenido nuevo
  // generado por el reporte, es la unión de lo que ya señalaron los demás
  // módulos de apoyo (por qué salió ese indicador de efectividad, qué
  // alertas siguen sin resolver, qué sugirió Sugerencia) — todo texto ya
  // editable/revisable en su módulo de origen, el reporte solo lo reúne.
  const alertasPendientesMensajes = (alertas || [])
    .filter((a) => a.estado === "pendiente" && (a.nivel === "critica" || a.nivel === "advertencia"))
    .map((a) => a.mensaje);
  const sugerenciasMensajes = (sugerencias || []).map((s) => s.mensaje);
  const recomendacionesProximaConsulta = [
    ...(efectividad?.motivos || []),
    ...alertasPendientesMensajes,
    ...sugerenciasMensajes,
  ];

  return {
    generadoEn: new Date(),
    paciente: {
      id: paciente.id,
      nombre: paciente.nombre,
      edad: paciente.edad,
      sexo: paciente.sexo,
      peso: pesoActual,
      pesoInicial,
      altura: paciente.altura,
      objetivo: paciente.objetivo,
      nivelActividad: paciente.nivelActividad,
      alergias: paciente.alergias,
      enfermedades: paciente.enfermedades,
      restricciones: paciente.restricciones,
      preferencias: paciente.preferencias,
    },
    dieta: {
      id: menu.id,
      estado: menu.estado,
      fechaInicio: menu.fechaInicio,
      fechaFin: menu.fechaFin,
      dias: (menu.dias || []).map((d) => ({
        numeroDia: d.numeroDia,
        caloriasTotales: d.caloriasTotales,
        comidas: (d.comidas || []).map((c) => ({
          tipoComida: c.tipoComida,
          nombrePlato: c.nombrePlato,
          calorias: c.calorias,
          detalles: (c.detalles || []).map((det) => ({
            nombreAlimento: det.nombreAlimento,
            cantidadUtilizada: det.cantidadUtilizada,
            unidadMedida: det.unidadMedida,
          })),
        })),
      })),
    },
    valoresNutricionales: {
      diarios: (menu.dias || []).map((d) => ({ numeroDia: d.numeroDia, nutrientes: d.nutrientes })),
      semanal: resumenNutricionalSemanal,
    },
    distribucionMacronutrientes: calcularDistribucionMacros(resumenNutricionalSemanal?.nutrientes),
    nutrientesDeficientesOExcesivos,
    alertas: alertas || [],
    evolucion: {
      pesoInicial,
      pesoActual,
      deltaPesoKg,
      totalConsultas: (consultas || []).length,
      consultas: consultas || [],
    },
    cumplimiento: resumenCumplimiento,
    efectividad,
    recomendacionesGuardadas: recomendacionesGuardadas || [],
    recomendacionesProximaConsulta,
  };
}

module.exports = { armar, calcularDistribucionMacros, esAlertaDeNutriente };

const { ajusteObjetivo } = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

const INDICADORES = ["efectiva", "parcialmente_efectiva", "necesita_ajustes", "informacion_insuficiente"];

// Margen para no marcar "retrocediendo"/"mejorando" por ruido de báscula
// (±300g entre consultas es normal, no una tendencia real).
const TOLERANCIA_KG = 0.3;

// Umbrales del puntaje combinado (ver evaluar()) que deciden el indicador
// final. No son un diagnóstico médico automático: son un resumen legible
// para que el nutriólogo decida — la palabra final siempre es suya (RF
// punto 10).
const PUNTAJE_EFECTIVA = 3;
const PUNTAJE_NECESITA_AJUSTES = -2;

function puntosCumplimiento(porcentaje) {
  if (porcentaje === null || porcentaje === undefined) return 0;
  if (porcentaje >= 80) return 2;
  if (porcentaje >= 50) return 1;
  return -1;
}

// Mismo criterio de dirección de objetivo que EvaluadorAlertas (Mifflin-St
// Jeor usa ±500 kcal/día para bajar/subir); acá solo nos importa el signo.
function direccionObjetivo(objetivo) {
  return Math.sign(ajusteObjetivo(objetivo));
}

// Compara la primera y la última consulta disponibles (evolución completa
// del tratamiento, no solo la más reciente) contra la dirección esperada
// del objetivo. Mismo veredicto de 4 estados que ya usa el frontend en
// HistorialPaciente.jsx (Mejorando/Manteniéndose/Retrocediendo/Cambio
// notable), reimplementado acá porque backend y frontend no comparten código.
function veredictoPeso(deltaPeso, direccion) {
  if (direccion === -1) {
    if (deltaPeso < -TOLERANCIA_KG) return "mejorando";
    if (deltaPeso > TOLERANCIA_KG) return "retrocediendo";
    return "manteniendose";
  }
  if (direccion === 1) {
    if (deltaPeso > TOLERANCIA_KG) return "mejorando";
    if (deltaPeso < -TOLERANCIA_KG) return "retrocediendo";
    return "manteniendose";
  }
  return Math.abs(deltaPeso) <= TOLERANCIA_KG ? "manteniendose" : "cambio_notable";
}

const PUNTOS_VEREDICTO_PESO = { mejorando: 2, manteniendose: 0, cambio_notable: -1, retrocediendo: -2 };

const ETIQUETAS_VEREDICTO_PESO = {
  mejorando: "mejorando",
  manteniendose: "manteniéndose",
  cambio_notable: "cambio de peso no esperado para el objetivo",
  retrocediendo: "retrocediendo",
};

// Combina cumplimiento del paciente (Fase 6), evolución de peso (Consulta)
// y alertas nutricionales pendientes (Alerta) del menú en un indicador único
// de efectividad + los motivos que lo explican. Función pura: no persiste
// nada, no lanza. La decisión de qué hacer con la dieta sigue siendo
// siempre del nutriólogo (RF puntos 2 y 10) — esto es apoyo, no un
// diagnóstico automático.
function evaluar({ paciente, resumenCumplimiento, alertas, consultas }) {
  const hayDatosCumplimiento = !!resumenCumplimiento && resumenCumplimiento.totalRegistros > 0;
  const hayDatosEvolucion = !!consultas && consultas.length >= 2;

  const motivos = [];

  if (!hayDatosCumplimiento && !hayDatosEvolucion) {
    motivos.push("No hay registros de cumplimiento ni al menos 2 consultas para evaluar evolución");
    return {
      indicador: "informacion_insuficiente",
      motivos,
      detalle: {
        porcentajeCumplimiento: null,
        tendenciaPeso: "sin_datos",
        deltaPesoKg: undefined,
        alertasCriticasPendientes: 0,
        alertasAdvertenciaPendientes: 0,
      },
    };
  }

  const alertasPendientes = (alertas || []).filter((a) => a.estado === "pendiente");
  const alertasCriticasPendientes = alertasPendientes.filter((a) => a.nivel === "critica").length;
  const alertasAdvertenciaPendientes = alertasPendientes.filter((a) => a.nivel === "advertencia").length;

  let puntaje = 0;
  puntaje += puntosCumplimiento(resumenCumplimiento?.porcentajeCumplimiento ?? null);
  puntaje -= alertasCriticasPendientes * 3;
  puntaje -= Math.min(alertasAdvertenciaPendientes, 3);

  if (hayDatosCumplimiento) {
    motivos.push(
      resumenCumplimiento.porcentajeCumplimiento !== null
        ? `Cumplimiento de la dieta: ${resumenCumplimiento.porcentajeCumplimiento}%`
        : "Hay registros de cumplimiento pero sin comidas planeadas para calcular el porcentaje",
    );
  } else {
    motivos.push("Sin registros de cumplimiento del paciente");
  }

  let tendenciaPeso = "sin_datos";
  let deltaPesoKg;
  if (hayDatosEvolucion) {
    const primera = consultas[0];
    const ultima = consultas[consultas.length - 1];
    const deltaPeso = ultima.peso - primera.peso;
    const direccion = direccionObjetivo(paciente.objetivo);
    tendenciaPeso = veredictoPeso(deltaPeso, direccion);
    deltaPesoKg = Number(deltaPeso.toFixed(2));
    puntaje += PUNTOS_VEREDICTO_PESO[tendenciaPeso];
    motivos.push(
      `Evolución de peso: ${ETIQUETAS_VEREDICTO_PESO[tendenciaPeso]} (${deltaPeso > 0 ? "+" : ""}${deltaPesoKg} kg)`,
    );
  } else {
    motivos.push("Menos de 2 consultas registradas: no se puede evaluar la tendencia de peso");
  }

  if (alertasCriticasPendientes > 0) {
    motivos.push(`${alertasCriticasPendientes} alerta(s) crítica(s) del menú sin resolver`);
  }
  if (alertasAdvertenciaPendientes > 0) {
    motivos.push(`${alertasAdvertenciaPendientes} alerta(s) de advertencia del menú sin resolver`);
  }

  let indicador;
  if (alertasCriticasPendientes > 0) {
    indicador = "necesita_ajustes";
  } else if (puntaje >= PUNTAJE_EFECTIVA) {
    indicador = "efectiva";
  } else if (puntaje <= PUNTAJE_NECESITA_AJUSTES) {
    indicador = "necesita_ajustes";
  } else {
    indicador = "parcialmente_efectiva";
  }

  return {
    indicador,
    motivos,
    detalle: {
      porcentajeCumplimiento: resumenCumplimiento?.porcentajeCumplimiento ?? null,
      tendenciaPeso,
      deltaPesoKg,
      alertasCriticasPendientes,
      alertasAdvertenciaPendientes,
    },
  };
}

module.exports = { evaluar, INDICADORES };

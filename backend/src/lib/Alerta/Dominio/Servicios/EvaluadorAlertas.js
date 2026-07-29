const {
  VALORES_DIARIOS_REFERENCIA,
  CALORIAS_MINIMAS_SEGURAS,
  CALORIAS_MAXIMAS_SEGURAS,
} = require("./ValoresReferencia");

const MICRONUTRIENTES = [
  { campo: "calcio", label: "calcio" },
  { campo: "hierro", label: "hierro" },
  { campo: "magnesio", label: "magnesio" },
  { campo: "potasio", label: "potasio" },
  { campo: "vitaminaA", label: "vitamina A" },
  { campo: "vitaminaC", label: "vitamina C" },
  { campo: "vitaminaD", label: "vitamina D" },
  { campo: "vitaminaB12", label: "vitamina B12" },
];

function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function slug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Promedio diario de un nutriente (las DV son diarias, el resumen es
// semanal). Si el campo no aparece en absoluto en el resumen es porque
// ningún alimento tenía ese dato — se devuelve undefined (no 0) para no
// confundir "sin información" con "deficiencia real".
function promedioDiario(nutrientes, campo) {
  return campo in nutrientes ? nutrientes[campo] / 7 : undefined;
}

// Factor de actividad de Mifflin-St Jeor, interpretado por palabra clave
// porque nivelActividad es texto libre en Paciente (no un enum). Aproximado
// a propósito: es mejor una estimación razonable que forzar al nutriólogo a
// re-capturar el dato en un formato rígido.
function factorActividad(nivelActividad) {
  const texto = normalizar(nivelActividad);
  if (texto.includes("muy activ") || texto.includes("atlet") || texto.includes("intens")) return 1.9;
  if (texto.includes("sedentari")) return 1.2;
  if (texto.includes("liger") || texto.includes("leve")) return 1.375;
  if (texto.includes("moderad")) return 1.55;
  if (texto.includes("activ")) return 1.725;
  return 1.375; // default conservador si no coincide ninguna palabra clave
}

function ajusteObjetivo(objetivo) {
  const texto = normalizar(objetivo);
  if (texto.includes("bajar") || texto.includes("perder") || texto.includes("reducir") || texto.includes("adelgazar"))
    return -500;
  if (texto.includes("subir") || texto.includes("aumentar") || texto.includes("ganar") || texto.includes("engordar"))
    return 500;
  return 0;
}

function calcularObjetivoCalorico(paciente) {
  const { edad, sexo, peso, altura, nivelActividad, objetivo } = paciente;
  if (!edad || !sexo || sexo === "otro") return null;

  const alturaCm = altura * 100;
  const bmr =
    sexo === "masculino"
      ? 10 * peso + 6.25 * alturaCm - 5 * edad + 5
      : 10 * peso + 6.25 * alturaCm - 5 * edad - 161;

  const tdee = bmr * factorActividad(nivelActividad);
  return tdee + ajusteObjetivo(objetivo);
}

// Evalúa el estado nutricional de un menú y devuelve alertas candidatas
// { tipo, nivel, mensaje }. Función pura: no persiste nada, no lanza — el
// caso de uso GenerarAlertas decide qué hacer con el resultado.
function evaluar({ paciente, alimentosUsados, resumenNutricionalSemanal }) {
  const alertas = [];
  const nutrientes = resumenNutricionalSemanal?.nutrientes || {};
  const DV = VALORES_DIARIOS_REFERENCIA;

  const proteinas = promedioDiario(nutrientes, "proteinas");
  if (proteinas !== undefined) {
    if (proteinas < DV.proteinas * 0.4) {
      alertas.push({ tipo: "proteina_insuficiente", nivel: "critica", mensaje: "El menú tiene una cantidad crítica de proteínas insuficiente" });
    } else if (proteinas < DV.proteinas * 0.7) {
      alertas.push({ tipo: "proteina_insuficiente", nivel: "advertencia", mensaje: "El menú tiene poca proteína" });
    }
  }

  const carbohidratos = promedioDiario(nutrientes, "carbohidratos");
  if (carbohidratos !== undefined && carbohidratos > DV.carbohidratos * 1.3) {
    alertas.push({ tipo: "carbohidratos_exceso", nivel: "advertencia", mensaje: "La distribución de carbohidratos no es equilibrada (exceso)" });
  }

  const grasasSaturadas = promedioDiario(nutrientes, "grasasSaturadas");
  if (grasasSaturadas !== undefined) {
    if (grasasSaturadas > DV.grasasSaturadas * 1.5) {
      alertas.push({ tipo: "grasas_saturadas_exceso", nivel: "critica", mensaje: "Exceso crítico de grasas saturadas" });
    } else if (grasasSaturadas > DV.grasasSaturadas) {
      alertas.push({ tipo: "grasas_saturadas_exceso", nivel: "advertencia", mensaje: "Exceso de grasas saturadas" });
    }
  }

  const fibra = promedioDiario(nutrientes, "fibra");
  if (fibra !== undefined && fibra < DV.fibra * 0.7) {
    alertas.push({ tipo: "fibra_insuficiente", nivel: "advertencia", mensaje: "Se recomienda añadir una fuente de fibra" });
  }

  const sodio = promedioDiario(nutrientes, "sodio");
  if (sodio !== undefined) {
    if (sodio > DV.sodio * 1.5) {
      alertas.push({ tipo: "sodio_exceso", nivel: "critica", mensaje: "La cantidad de sodio supera críticamente el valor recomendado" });
    } else if (sodio > DV.sodio) {
      alertas.push({ tipo: "sodio_exceso", nivel: "advertencia", mensaje: "La cantidad de sodio supera el valor recomendado" });
    }
  }

  for (const { campo, label } of MICRONUTRIENTES) {
    const valor = promedioDiario(nutrientes, campo);
    if (valor !== undefined && valor < DV[campo] * 0.5) {
      alertas.push({
        tipo: `micronutriente_bajo_${campo}`,
        nivel: "advertencia",
        mensaje: `El menú tiene un bajo contenido de ${label}`,
      });
    }
  }

  // Alergias: coincidencia de texto (sin tildes, insensible a mayúsculas)
  // entre el nombre del alimento y cada alergia registrada. Heurística
  // simple, no un catálogo de ingredientes — puede haber falsos negativos
  // (ej. "maní" no detecta "cacahuate"); el nutriólogo sigue siendo quien
  // decide.
  for (const alimento of alimentosUsados || []) {
    const nombreNorm = normalizar(alimento.nombre);
    for (const alergia of paciente.alergias || []) {
      const alergiaNorm = normalizar(alergia);
      if (alergiaNorm && nombreNorm.includes(alergiaNorm)) {
        alertas.push({
          tipo: `alergia_${slug(alimento.nombre)}_${slug(alergia)}`,
          nivel: "critica",
          mensaje: `"${alimento.nombre}" es incompatible con la alergia registrada a "${alergia}"`,
        });
      }
    }
  }

  // Enfermedades: heurística orientativa por palabra clave, solo advertencia
  // (nunca crítica automática) — nunca reemplaza el criterio médico/nutricional.
  const enfermedadesNorm = (paciente.enfermedades || []).map(normalizar);
  const tieneEnfermedad = (...palabrasClave) =>
    enfermedadesNorm.some((e) => palabrasClave.some((p) => e.includes(p)));

  if (tieneEnfermedad("diabetes")) {
    const azucares = promedioDiario(nutrientes, "azucares");
    if (azucares !== undefined && azucares > 25) {
      alertas.push({
        tipo: "enfermedad_diabetes_azucares",
        nivel: "advertencia",
        mensaje: "El menú tiene un contenido de azúcares alto para un paciente con diabetes registrada (orientativo, no reemplaza criterio médico)",
      });
    }
  }
  if (tieneEnfermedad("hipertension", "presion alta")) {
    if (sodio !== undefined && sodio > DV.sodio) {
      alertas.push({
        tipo: "enfermedad_hipertension_sodio",
        nivel: "advertencia",
        mensaje: "El menú tiene un contenido de sodio alto para un paciente con hipertensión registrada (orientativo, no reemplaza criterio médico)",
      });
    }
  }
  if (tieneEnfermedad("renal", "rinon")) {
    const potasio = promedioDiario(nutrientes, "potasio");
    if (potasio !== undefined && potasio > DV.potasio) {
      alertas.push({
        tipo: "enfermedad_renal_potasio",
        nivel: "advertencia",
        mensaje: "El menú tiene un contenido de potasio alto para un paciente con una condición renal registrada (orientativo, no reemplaza criterio médico)",
      });
    }
  }

  // Calorías: piso/techo de seguridad siempre se evalúa; el objetivo
  // personalizado (Mifflin-St Jeor) solo si hay edad/sexo/nivelActividad.
  const calorias = promedioDiario(nutrientes, "calorias");
  if (calorias !== undefined) {
    if (calorias < CALORIAS_MINIMAS_SEGURAS || calorias > CALORIAS_MAXIMAS_SEGURAS) {
      alertas.push({
        tipo: "calorias_fuera_de_rango_seguro",
        nivel: "critica",
        mensaje: "La dieta está fuera de un rango calórico seguro (muy baja o muy alta)",
      });
    } else {
      const objetivoCalorico = calcularObjetivoCalorico(paciente);
      if (objetivoCalorico && Math.abs(calorias - objetivoCalorico) / objetivoCalorico > 0.2) {
        alertas.push({
          tipo: "calorias_desviadas_objetivo",
          nivel: "advertencia",
          mensaje: "La dieta no coincide con el objetivo nutricional del paciente (calorías muy por debajo o por encima de lo esperado)",
        });
      }
    }
  }

  // Variedad: grupos alimenticios distintos usados en toda la semana.
  const gruposUsados = new Set();
  for (const alimento of alimentosUsados || []) {
    for (const grupo of alimento.gruposAlimenticios || []) gruposUsados.add(grupo);
  }
  if (gruposUsados.size < 5) {
    alertas.push({ tipo: "menu_poco_variado", nivel: "advertencia", mensaje: "El menú tiene poca variedad de grupos alimenticios" });
  }

  if (resumenNutricionalSemanal && resumenNutricionalSemanal.completo === false) {
    // Nombrar los alimentos concretos (no solo los campos) es lo que
    // realmente le sirve al nutriólogo para saber qué completar (ej. con
    // "Buscar en USDA") — la lista de campos por sí sola no es accionable.
    const sinInfo = [
      ...new Set((alimentosUsados || []).filter((a) => !a.infoNutricional).map((a) => a.nombre)),
    ];
    const mensaje =
      sinInfo.length > 0
        ? `Alimentos sin información nutricional: ${sinInfo.slice(0, 5).join(", ")}${sinInfo.length > 5 ? ` y ${sinInfo.length - 5} más` : ""}. Complétala manualmente o con "Buscar en USDA".`
        : "Algunos alimentos del menú tienen información nutricional incompleta";
    alertas.push({ tipo: "datos_nutricionales_faltantes", nivel: "informativa", mensaje });
  }

  return alertas;
}

module.exports = { evaluar, calcularObjetivoCalorico, factorActividad, ajusteObjetivo, normalizar, slug };

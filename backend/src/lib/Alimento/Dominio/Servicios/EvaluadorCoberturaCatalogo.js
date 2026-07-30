const {
  VALORES_DIARIOS_REFERENCIA,
} = require("../../../Alerta/Dominio/Servicios/ValoresReferencia");
const {
  normalizar,
  slug,
  ajusteObjetivo,
} = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

// Grupos que deben estar representados en el catálogo antes de generar el
// menú. Una sola opción cubre el paso guiado; `alternativas` permite que un
// grupo nutricionalmente equivalente también lo resuelva.
const GRUPOS_ESENCIALES = [
  { grupo: "proteinas", label: "Proteínas", alternativas: ["legumbres"], nivel: "critica" },
  { grupo: "verduras_hortalizas", label: "Verduras y hortalizas", alternativas: [], nivel: "critica" },
  { grupo: "granos_cereales", label: "Granos y cereales", alternativas: ["carbohidratos"], nivel: "critica" },
  { grupo: "frutas", label: "Frutas", alternativas: [], nivel: "advertencia" },
  { grupo: "grasas_saludables", label: "Grasas saludables", alternativas: ["frutos_secos_semillas"], nivel: "advertencia" },
  { grupo: "lacteos", label: "Lácteos", alternativas: [], nivel: "advertencia" },
];

// Nutrientes que se revisan a nivel de catálogo: si NINGÚN alimento
// registrado es fuente relevante de uno de estos, el menú nunca podrá
// cubrirlo por más que se combinen los alimentos. Es el chequeo que responde
// al "que no solo se enfoque en calorías".
const NUTRIENTES_CLAVE = [
  { campo: "proteinas", label: "proteína", grupoSugerido: "proteinas" },
  { campo: "fibra", label: "fibra", grupoSugerido: "verduras_hortalizas" },
  { campo: "calcio", label: "calcio", grupoSugerido: "lacteos" },
  { campo: "hierro", label: "hierro", grupoSugerido: "legumbres" },
  { campo: "vitaminaC", label: "vitamina C", grupoSugerido: "frutas" },
  { campo: "vitaminaA", label: "vitamina A", grupoSugerido: "verduras_hortalizas" },
  { campo: "potasio", label: "potasio", grupoSugerido: "frutas" },
];

// Un alimento cuenta como "fuente" de un nutriente si aporta al menos este %
// del valor diario en su cantidad de referencia (100g o 1 porción). Más
// exigente que el umbral de Sugerencia (5%) porque aquí la pregunta no es
// "cuál sugiero para completar" sino "¿el catálogo tiene siquiera una fuente
// de esto?" — una traza no califica.
const UMBRAL_ES_FUENTE = 0.1;

// Proporción de procesados sobre el total del catálogo a partir de la cual se
// avisa. No es una regla nutricional dura, es un aviso de composición.
const MAX_PROPORCION_PROCESADOS = 0.3;

// Restricciones y alergias se capturan como texto libre, así que la
// coincidencia por nombre ("maní" contra "Maní salado") no alcanza: nadie
// escribe "Sin trigo" cuando quiere decir "Sin gluten". Este mapa traduce la
// restricción declarada a los ingredientes que suelen delatarla en el nombre
// de un alimento. Es una heurística deliberadamente conservadora: puede tener
// falsos negativos (no conoce todos los sinónimos) y el nutriólogo sigue
// siendo quien decide — nunca se bloquea nada por esto.
const SINONIMOS_RESTRICCION = {
  gluten: ["trigo", "pan", "pasta", "harina", "cebada", "centeno", "galleta", "cerveza", "tortilla de harina"],
  lactosa: ["leche", "queso", "yogur", "yoghurt", "crema", "mantequilla"],
  lacteos: ["leche", "queso", "yogur", "yoghurt", "crema", "mantequilla"],
  azucar: ["azucar", "dulce", "refresco", "gaseosa", "caramelo", "chocolate", "mermelada"],
  sodio: ["sal", "embutido", "enlatado", "jamon", "salchicha", "tocino", "chorizo"],
  sal: ["embutido", "enlatado", "jamon", "salchicha", "tocino", "chorizo"],
  carne: ["res", "cerdo", "pollo", "pavo", "jamon", "salchicha", "tocino", "bistec", "carne"],
  cerdo: ["cerdo", "jamon", "tocino", "chuleta", "chorizo"],
  mariscos: ["camaron", "langosta", "cangrejo", "almeja", "mejillon", "pulpo", "calamar"],
  pescado: ["pescado", "atun", "salmon", "tilapia", "sardina", "trucha", "bacalao"],
  mani: ["mani", "cacahuate"],
  huevo: ["huevo", "mayonesa"],
  soya: ["soya", "soja", "tofu", "edamame"],
  frutos_secos: ["nuez", "nueces", "almendra", "mani", "cacahuate", "avellana", "pistacho"],
};

// Valores de restricciones/preferencias que significan "no hay ninguna" —
// mismo criterio que usa el frontend para no pintarlos como advertencia.
const SIN_VALOR = /^(ninguna?|ninguno|no aplica|n\/a|-|none)$/i;

function esValorVacio(texto) {
  return !texto || SIN_VALOR.test(texto.toString().trim());
}

// "Sin gluten" / "Evitar lácteos" / "Bajo en sodio" → "gluten" / "lacteos" /
// "sodio". El nutriólogo escribe la restricción en prosa; lo que sirve para
// comparar es el ingrediente.
function terminoRestringido(texto) {
  return normalizar(texto)
    .replace(/^(sin|no|evitar|libre de|bajo en|reducir|alergia a|intolerancia a|intolerante a)\s+/i, "")
    .trim();
}

// Términos que, si aparecen en el nombre de un alimento, lo vuelven
// sospechoso para esta restricción: el término declarado más sus sinónimos.
function terminosADetectar(restriccion) {
  const termino = terminoRestringido(restriccion);
  if (!termino) return [];
  const clave = termino.replace(/\s+/g, "_");
  return [termino, ...(SINONIMOS_RESTRICCION[clave] || SINONIMOS_RESTRICCION[termino] || [])];
}

function esFuenteDe(alimento, campo) {
  const valor = alimento.infoNutricional?.[campo];
  const dv = VALORES_DIARIOS_REFERENCIA[campo];
  return typeof valor === "number" && dv > 0 && valor >= dv * UMBRAL_ES_FUENTE;
}

// Cuenta cuántos alimentos del catálogo pertenecen al grupo o a cualquiera de
// sus alternativas nutricionales.
function contarEnGrupo(alimentos, grupo, alternativas) {
  const aceptados = [grupo, ...alternativas];
  return alimentos.filter((a) =>
    (a.gruposAlimenticios || []).some((g) => aceptados.includes(g)),
  ).length;
}

function esPreferenciaVegetal(preferencias) {
  const valor = normalizar(preferencias);
  return valor.includes("vegetarian") || valor.includes("vegan");
}

function grupoAccionable(grupo, paciente) {
  if (grupo === "proteinas" && esPreferenciaVegetal(paciente?.preferencias)) {
    return "legumbres";
  }
  return grupo;
}

function motivoGrupoPorObjetivo(grupo, objetivo) {
  const direccion = ajusteObjetivo(objetivo);

  if (direccion < 0) {
    const motivos = {
      verduras_hortalizas:
        "Para el objetivo de perder peso, una mayor variedad de verduras ayuda a construir comidas con fibra, volumen y saciedad.",
      frutas:
        "Para el objetivo de perder peso, disponer de distintas frutas aporta alternativas con fibra para colaciones y preparaciones.",
      proteinas:
        "Para el objetivo de perder peso, contar con varias fuentes de proteína facilita menús completos y variados.",
      legumbres:
        "Para el objetivo de perder peso, las legumbres aportan proteína vegetal y fibra para preparar comidas con mayor saciedad.",
      granos_cereales:
        "Para el objetivo de perder peso, tener distintos granos permite variar las porciones y preparaciones del menú.",
    };
    return motivos[grupo];
  }

  if (direccion > 0) {
    const motivos = {
      proteinas:
        "Para el objetivo de aumentar peso o masa muscular, conviene disponer de distintas fuentes de proteína para distribuirlas durante la semana.",
      legumbres:
        "Para el objetivo de aumentar peso o masa muscular, las legumbres amplían las fuentes de proteína y energía del menú.",
      grasas_saludables:
        "Para el objetivo de aumentar peso, las grasas saludables permiten elevar la energía del menú sin aumentar demasiado el volumen.",
      lacteos:
        "Para el objetivo de aumentar peso, los lácteos o sus alternativas compatibles pueden aportar energía y proteína.",
      granos_cereales:
        "Para el objetivo de aumentar peso, una mayor variedad de granos facilita completar la energía de las comidas.",
    };
    return motivos[grupo];
  }

  return undefined;
}

function crearAlertaGrupo({ grupo, label, nivel, paciente }) {
  const grupoSugerido = grupoAccionable(grupo, paciente);
  const motivoObjetivo = motivoGrupoPorObjetivo(grupoSugerido, paciente?.objetivo);

  return {
    tipo: `grupo_ausente_${grupo}`,
    nivel,
    grupoSugerido,
    faltantes: 1,
    mensaje: `Falta agregar un alimento del grupo "${label}".${motivoObjetivo ? ` ${motivoObjetivo}` : ""}`,
    // Compatibilidad temporal con consumidores existentes. Siempre contiene
    // un único grupo: las alternativas solo sirven para calcular cobertura.
    gruposSugeridos: [grupoSugerido],
  };
}

// Evalúa si el catálogo de alimentos de un paciente alcanza para construirle
// una dieta balanceada, y devuelve qué le falta. Función pura: no persiste
// nada, no lanza y no bloquea ninguna operación — es la guía que el
// nutriólogo ve mientras registra alimentos, la decisión sigue siendo suya
// (misma regla de gobernanza que Alerta y Sugerencia).
function evaluar({ paciente, alimentos }) {
  const catalogo = alimentos || [];
  const alertas = [];

  const conInfoNutricional = catalogo.filter((a) => a.infoNutricional);
  const gruposPresentes = new Set();
  for (const alimento of catalogo) {
    for (const grupo of alimento.gruposAlimenticios || []) gruposPresentes.add(grupo);
  }

  // 1) Cada recomendación representa un grupo todavía ausente. En cuanto se
  // registra el primer alimento compatible, el grupo queda cubierto y su
  // recomendación desaparece en el siguiente recálculo.
  let esencialesCubiertos = 0;
  for (const { grupo, label, alternativas, nivel } of GRUPOS_ESENCIALES) {
    const cantidad = contarEnGrupo(catalogo, grupo, alternativas);
    if (cantidad === 0) {
      alertas.push(
        crearAlertaGrupo({ grupo, label, nivel, paciente }),
      );
      continue;
    }
    esencialesCubiertos++;
  }

  // 2) Alimentos sin información nutricional. Va antes que el chequeo de
  // nutrientes porque es su causa raíz: sin estos datos no hay nada que
  // evaluar más allá de los grupos.
  const sinInfo = catalogo.filter((a) => !a.infoNutricional);
  if (sinInfo.length > 0) {
    const nombres = sinInfo.slice(0, 5).map((a) => a.nombre).join(", ");
    const resto = sinInfo.length > 5 ? ` y ${sinInfo.length - 5} más` : "";
    alertas.push({
      tipo: "alimentos_sin_info_nutricional",
      nivel: sinInfo.length === catalogo.length ? "critica" : "advertencia",
      mensaje: `${sinInfo.length} de ${catalogo.length} alimentos no tienen información nutricional (${nombres}${resto}). Sin ella el menú solo se puede evaluar por calorías estimadas — complétala a mano o con "Buscar en USDA".`,
      gruposSugeridos: [],
    });
  }

  // 3) Nutrientes clave sin ninguna fuente en el catálogo. Solo tiene sentido
  // preguntarlo si al menos un alimento tiene datos cargados; si no, la
  // alerta real es la anterior.
  if (conInfoNutricional.length > 0) {
    for (const { campo, label, grupoSugerido } of NUTRIENTES_CLAVE) {
      const hayFuente = conInfoNutricional.some((a) => esFuenteDe(a, campo));
      if (!hayFuente) {
        alertas.push({
          tipo: `sin_fuente_${campo}`,
          nivel: "advertencia",
          mensaje: `Ningún alimento del catálogo es una fuente relevante de ${label}. El menú no podrá cubrir este nutriente con los alimentos actuales.`,
          grupoSugerido,
          gruposSugeridos: [grupoSugerido],
        });
      }
    }
  }

  // 4) Alimentos que choquen con las alergias registradas. Crítico: un menú
  // generado con estos alimentos puede dañar al paciente.
  for (const alimento of catalogo) {
    const nombreNorm = normalizar(alimento.nombre);
    for (const alergia of paciente?.alergias || []) {
      if (esValorVacio(alergia)) continue;
      const detectados = terminosADetectar(alergia).filter((t) => t && nombreNorm.includes(t));
      if (detectados.length > 0) {
        alertas.push({
          tipo: `alimento_alergia_${slug(alimento.nombre)}_${slug(alergia)}`,
          nivel: "critica",
          mensaje: `"${alimento.nombre}" parece incompatible con la alergia registrada a "${alergia}". Revísalo o quítalo del catálogo antes de generar el menú.`,
          gruposSugeridos: [],
        });
      }
    }
  }

  // 5) Lo mismo contra las restricciones (texto libre, menos confiable que
  // una alergia declarada) → advertencia, no crítica.
  if (!esValorVacio(paciente?.restricciones)) {
    const terminos = terminosADetectar(paciente.restricciones).filter(Boolean);
    for (const alimento of catalogo) {
      const nombreNorm = normalizar(alimento.nombre);
      if (terminos.some((t) => nombreNorm.includes(t))) {
        alertas.push({
          tipo: `alimento_restriccion_${slug(alimento.nombre)}`,
          nivel: "advertencia",
          mensaje: `"${alimento.nombre}" podría no respetar la restricción "${paciente.restricciones}". Confírmalo antes de usarlo en el menú.`,
          gruposSugeridos: [],
        });
      }
    }
  }

  // 6) Composición del catálogo frente al objetivo del paciente. Se reutiliza
  // ajusteObjetivo de Alerta (mismo criterio por palabra clave que ya usan
  // las alertas y la efectividad) para no tener una cuarta interpretación del
  // objetivo.
  if (catalogo.length > 0) {
    const procesados = catalogo.filter((a) =>
      (a.gruposAlimenticios || []).includes("procesados"),
    ).length;
    if (procesados / catalogo.length > MAX_PROPORCION_PROCESADOS) {
      alertas.push({
        tipo: "exceso_procesados",
        nivel: "advertencia",
        mensaje: `${procesados} de ${catalogo.length} alimentos son procesados. Agrega opciones frescas para que el menú pueda equilibrarse.`,
        grupoSugerido: "verduras_hortalizas",
        gruposSugeridos: ["verduras_hortalizas"],
      });
    }

  }

  return {
    // Ojo: "listo" significa que no quedan huecos críticos, no que la dieta
    // vaya a ser óptima. Nunca bloquea la generación del menú.
    listoParaMenu: !alertas.some((a) => a.nivel === "critica"),
    resumen: {
      totalAlimentos: catalogo.length,
      conInfoNutricional: conInfoNutricional.length,
      gruposCubiertos: gruposPresentes.size,
      esencialesCubiertos,
      esencialesTotal: GRUPOS_ESENCIALES.length,
    },
    alertas,
  };
}

module.exports = {
  evaluar,
  GRUPOS_ESENCIALES,
  terminosADetectar,
  esFuenteDe,
};

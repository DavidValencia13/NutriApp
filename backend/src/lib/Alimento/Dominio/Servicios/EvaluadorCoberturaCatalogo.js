const {
  VALORES_DIARIOS_REFERENCIA,
} = require("../../../Alerta/Dominio/Servicios/ValoresReferencia");
const {
  normalizar,
  slug,
  ajusteObjetivo,
} = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

// Grupos que una dieta balanceada necesita tener representados en el catálogo
// del paciente ANTES de generar el menú. `minimo` no es un capricho: el menú
// es de 7 días, así que con una sola fuente de proteína el generador no tiene
// más opción que repetirla todos los días. `alternativas` son grupos que
// cubren la misma función nutricional (legumbres también aporta proteína,
// frutos secos también aportan grasas saludables).
const GRUPOS_ESENCIALES = [
  { grupo: "proteinas", label: "Proteínas", minimo: 3, alternativas: ["legumbres"], nivel: "critica" },
  { grupo: "verduras_hortalizas", label: "Verduras y hortalizas", minimo: 3, alternativas: [], nivel: "critica" },
  { grupo: "granos_cereales", label: "Granos y cereales", minimo: 2, alternativas: ["carbohidratos"], nivel: "critica" },
  { grupo: "frutas", label: "Frutas", minimo: 2, alternativas: [], nivel: "advertencia" },
  { grupo: "grasas_saludables", label: "Grasas saludables", minimo: 1, alternativas: ["frutos_secos_semillas"], nivel: "advertencia" },
  { grupo: "lacteos", label: "Lácteos", minimo: 1, alternativas: [], nivel: "advertencia" },
];

// Nutrientes que se revisan a nivel de catálogo: si NINGÚN alimento
// registrado es fuente relevante de uno de estos, el menú nunca podrá
// cubrirlo por más que se combinen los alimentos. Es el chequeo que responde
// al "que no solo se enfoque en calorías".
const NUTRIENTES_CLAVE = [
  { campo: "proteinas", label: "proteína", gruposSugeridos: ["proteinas", "legumbres", "lacteos"] },
  { campo: "fibra", label: "fibra", gruposSugeridos: ["legumbres", "verduras_hortalizas", "granos_cereales"] },
  { campo: "calcio", label: "calcio", gruposSugeridos: ["lacteos", "frutos_secos_semillas"] },
  { campo: "hierro", label: "hierro", gruposSugeridos: ["proteinas", "legumbres"] },
  { campo: "vitaminaC", label: "vitamina C", gruposSugeridos: ["frutas", "verduras_hortalizas"] },
  { campo: "vitaminaA", label: "vitamina A", gruposSugeridos: ["verduras_hortalizas", "frutas"] },
  { campo: "potasio", label: "potasio", gruposSugeridos: ["frutas", "verduras_hortalizas"] },
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

const NIVEL_INFERIOR = { critica: "advertencia", advertencia: "informativa", informativa: "informativa" };

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

  if (catalogo.length === 0) {
    alertas.push({
      tipo: "catalogo_vacio",
      nivel: "critica",
      mensaje:
        "Este paciente no tiene alimentos registrados. Agrega al menos una fuente de proteína, verduras y granos para poder generar un menú balanceado.",
      gruposSugeridos: ["proteinas", "verduras_hortalizas", "granos_cereales"],
    });
  }

  // 1) Grupos esenciales: ausentes primero (lo que impide balancear), luego
  // los que están pero con tan pocas opciones que el menú se repetiría.
  let esencialesCubiertos = 0;
  if (catalogo.length > 0) {
    for (const { grupo, label, minimo, alternativas, nivel } of GRUPOS_ESENCIALES) {
      const cantidad = contarEnGrupo(catalogo, grupo, alternativas);
      if (cantidad === 0) {
        alertas.push({
          tipo: `grupo_ausente_${grupo}`,
          nivel,
          mensaje: `Falta agregar alimentos del grupo "${label}". Sin esta fuente la dieta no puede quedar balanceada.`,
          gruposSugeridos: [grupo, ...alternativas],
        });
        continue;
      }
      esencialesCubiertos++;
      if (cantidad < minimo) {
        alertas.push({
          tipo: `grupo_poca_variedad_${grupo}`,
          nivel: NIVEL_INFERIOR[nivel],
          mensaje: `Solo hay ${cantidad} ${cantidad === 1 ? "opción" : "opciones"} de "${label}". Con el objetivo de "${paciente?.objetivo || "el paciente"}" conviene tener más variedad en este grupo — agrega al menos ${minimo - cantidad} más.`,
          gruposSugeridos: [grupo, ...alternativas],
        });
      }
    }
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
    for (const { campo, label, gruposSugeridos } of NUTRIENTES_CLAVE) {
      const hayFuente = conInfoNutricional.some((a) => esFuenteDe(a, campo));
      if (!hayFuente) {
        alertas.push({
          tipo: `sin_fuente_${campo}`,
          nivel: "advertencia",
          mensaje: `Ningún alimento del catálogo es una fuente relevante de ${label}. El menú no podrá cubrir este nutriente con los alimentos actuales.`,
          gruposSugeridos,
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
        gruposSugeridos: ["verduras_hortalizas", "frutas", "proteinas"],
      });
    }

    const direccion = ajusteObjetivo(paciente?.objetivo);
    if (direccion < 0) {
      // Bajar peso: la saciedad la dan fibra y proteína, no el recorte de
      // calorías por sí solo.
      const fuentesFibra = contarEnGrupo(catalogo, "verduras_hortalizas", ["legumbres", "frutas"]);
      if (fuentesFibra < 3) {
        alertas.push({
          tipo: "objetivo_bajar_peso_pocas_fuentes_saciedad",
          nivel: "advertencia",
          mensaje: `El objetivo es "${paciente.objetivo}", pero hay pocas fuentes de fibra (${fuentesFibra}). Verduras, frutas y legumbres ayudan a la saciedad con pocas calorías.`,
          gruposSugeridos: ["verduras_hortalizas", "legumbres", "frutas"],
        });
      }
    } else if (direccion > 0) {
      // Subir peso: hacen falta alimentos densos en energía, si no el menú
      // tiene que llegar a las calorías objetivo a base de volumen.
      const fuentesDensas = contarEnGrupo(catalogo, "grasas_saludables", [
        "frutos_secos_semillas",
        "lacteos",
      ]);
      if (fuentesDensas < 2) {
        alertas.push({
          tipo: "objetivo_subir_peso_pocas_fuentes_densas",
          nivel: "advertencia",
          mensaje: `El objetivo es "${paciente.objetivo}", pero hay pocas fuentes densas en energía (${fuentesDensas}). Grasas saludables, frutos secos y lácteos ayudan a subir calorías sin aumentar el volumen de las comidas.`,
          gruposSugeridos: ["grasas_saludables", "frutos_secos_semillas", "lacteos"],
        });
      }
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

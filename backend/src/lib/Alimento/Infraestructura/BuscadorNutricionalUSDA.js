const { ServicioExternoError } = require("../Dominio/Errores");

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_TIMEOUT_MS = Number(process.env.USDA_FDC_TIMEOUT_MS) || 10000;

const BUSQUEDAS_ESPECIFICAS = {
  leche: "milk, whole, 3.25% milkfat",
  "leche entera": "milk, whole, 3.25% milkfat",
  "milk, whole": "milk, whole, 3.25% milkfat",
  "leche descremada": "milk, nonfat, fluid",
  "leche desnatada": "milk, nonfat, fluid",
  "milk, nonfat, skim": "milk, nonfat, fluid",
};

function normalizar(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// USDA ordena los resultados por coincidencia de texto, no por "el alimento
// más típico": para "apple" el primero es "Croissants, apple" y la manzana
// cruda aparece más abajo. Por eso se piden varios resultados y se elige el
// mejor con estas reglas (prefijos de palabra, en minúsculas).
const RESULTADOS_A_EVALUAR = 25;
const PROCESADO = [
  "croissant", "strudel", "babyfood", "juice", "butter", "spread", "meatless",
  "fat", "frankfurter", "bologna", "bratwurst", "sausage", "fast", "extender",
  "souffle", "spaghetti", "pasta", "oil", "marmalade", "jam", "jelly", "pie",
  "cake", "bread", "cookie", "cracker", "candied", "canned", "dried",
  "dehydrated", "powder", "liquid", "sauce", "soup", "fried", "breaded",
  "puffed", "flour", "frozen", "sweetened", "syrup", "nectar", "drink",
  "bran", "noodle", "vermicelli", "mix", "peel", "beverage", "sherbet",
  "relish", "restaurant", "snack", "filling", "muffin", "bagel", "roll",
  "sprout",
];
const BASICO = ["raw", "fresh", "whole", "breast", "lean", "uncooked", "dry"];

function tokensIngles(texto) {
  return normalizar(texto).replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
}

// Singular/plural: "apples" ~ "apple", "tomatoes" ~ "tomato". Se prueban
// las variantes sin "s" y sin "es" porque ninguna regla sola sirve para todo
function variantes(t) {
  const v = [t];
  if (t.length > 3 && t.endsWith("s")) v.push(t.slice(0, -1));
  if (t.length > 4 && t.endsWith("es")) v.push(t.slice(0, -2));
  return v;
}

const iguales = (a, b) => {
  const vb = variantes(b);
  return variantes(a).some((x) => vb.includes(x));
};

const tieneEnergia = (food) =>
  (food.foodNutrients || []).some(
    (n) => NOMBRES_ENERGIA.has(n.nutrientName) && n.unitName?.toUpperCase() === "KCAL",
  );

function cuenta(palabras, prefijos) {
  return palabras.filter((t) => prefijos.some((p) => t.startsWith(p))).length;
}

// Palabras que describen el estado o la variedad, no el alimento en sí.
// Todo lo demás de la traducción ("tuna", "olive", "oil", "tree", "tomato")
// es el núcleo: el resultado de USDA debe contenerlo completo.
const DESCRIPTORES = new Set([
  "raw", "crude", "fresh", "whole", "cooked", "uncooked", "dry", "dried", "canned",
  "frozen", "solid", "solids", "drained", "water", "light", "white", "red",
  "green", "yellow", "regular", "enriched", "unenriched", "plain", "lowfat",
  "nonfat", "boneless", "skinless", "with", "without", "skin", "in", "of",
  "and", "or", "the", "a", "mature", "seeds", "long", "short", "medium",
  "grain", "ripe", "sweet", "pack", "only", "meat", "all", "varieties",
]);

// Elige el mejor resultado de USDA, o null si ninguno es el alimento buscado
// (mejor no sugerir nada que sugerir otro alimento: entonces se usa la
// tabla USFQ). Preferencias, en orden: que traiga las calorías, que las
// palabras del alimento estén al inicio de la descripción ("Apples, raw"
// antes que "Croissants, apple"; "Oil, olive" antes que "Oil, corn, peanut,
// and olive"), que tenga más palabras de la búsqueda (respeta búsquedas
// precisas como "tuna, canned in water"), que no sea una versión procesada, que
// sea la forma básica (cruda/fresca) y que la descripción sea corta.
function elegirMejorResultado(consulta, foods) {
  const q = tokensIngles(consulta);
  const nucleo = q.filter((t) => !DESCRIPTORES.has(t));
  const claves = nucleo.length > 0 ? nucleo : q;

  let mejor = null;
  for (const food of foods) {
    const d = tokensIngles(food.description);
    const posiciones = claves.map((x) => d.findIndex((t) => iguales(x, t)));
    if (d.length === 0 || posiciones.includes(-1)) continue;
    const resto = d.filter((t) => !q.some((x) => iguales(x, t)));
    const puntaje = [
      tieneEnergia(food) ? 0 : 1,
      posiciones.reduce((suma, i) => suma + i, 0),
      q.filter((x) => !d.some((t) => iguales(x, t))).length,
      cuenta(resto, PROCESADO),
      -cuenta(resto, BASICO),
      d.length,
    ];
    if (!mejor || menorQue(puntaje, mejor.puntaje)) mejor = { food, puntaje };
  }
  return mejor ? mejor.food : null;
}

function menorQue(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

function esAlimentoLiquido(description) {
  const texto = (description || "").toLowerCase();
  const excluidos = ["powder", "dry", "cheese", "dessert", "cracker"];
  if (excluidos.some((termino) => texto.includes(termino))) return false;
  return (
    texto.startsWith("milk,") ||
    texto.includes(" fluid") ||
    texto.includes("juice") ||
    texto.includes("water") ||
    texto.includes("coffee, brewed") ||
    texto.includes("tea, brewed") ||
    texto.includes("oil")
  );
}

// Mapeo del nombre de nutriente tal como lo devuelve USDA FoodData Central
// (campo "nutrientName" en foodNutrients[]) a los campos de
// Alimento.CAMPOS_NUTRIENTES. Los que no aparecen acá simplemente no se
// autocompletan (infoNutricional tolera campos faltantes desde la Fase 1).
// La energía llega con varios nombres según el tipo de dato de USDA
// (SR Legacy: "Energy"; Foundation: "Energy (Atwater ... Factors)") y
// repetida en kJ y en kcal: solo se acepta la que viene en kcal.
const NOMBRES_ENERGIA = new Set([
  "Energy",
  "Energy (Atwater General Factors)",
  "Energy (Atwater Specific Factors)",
]);

const MAPEO_NUTRIENTES = {
  Protein: "proteinas",
  "Carbohydrate, by difference": "carbohidratos",
  "Total lipid (fat)": "grasasTotales",
  "Fatty acids, total saturated": "grasasSaturadas",
  "Fiber, total dietary": "fibra",
  "Sugars, total": "azucares",
  "Sugars, total including NLEA": "azucares",
  "Total Sugars": "azucares",
  "Sugars, Total": "azucares",
  "Sodium, Na": "sodio",
  "Potassium, K": "potasio",
  "Calcium, Ca": "calcio",
  "Iron, Fe": "hierro",
  "Magnesium, Mg": "magnesio",
  "Vitamin A, RAE": "vitaminaA",
  "Vitamin C, total ascorbic acid": "vitaminaC",
  "Vitamin D (D2 + D3)": "vitaminaD",
  "Vitamin B-12": "vitaminaB12",
};

class BuscadorNutricionalUSDA {
  constructor(pedirCompletion, fetchFn = fetch) {
    this.pedirCompletion = pedirCompletion;
    this.fetchFn = fetchFn;
  }

  async buscar(nombreAlimento) {
    if (!process.env.USDA_FDC_API_KEY) {
      throw new ServicioExternoError("USDA_FDC_API_KEY no está configurada");
    }

    const nombreNormalizado = normalizar(nombreAlimento);
    const traduccion = BUSQUEDAS_ESPECIFICAS[nombreNormalizado]
      ? { nombreIngles: BUSQUEDAS_ESPECIFICAS[nombreNormalizado] }
      : await this._traducir(nombreAlimento);
    const { nombreIngles } = traduccion;

    const url = new URL(USDA_SEARCH_URL);
    url.searchParams.set("api_key", process.env.USDA_FDC_API_KEY);
    url.searchParams.set("query", nombreIngles);
    url.searchParams.set("dataType", "Foundation,SR Legacy");
    url.searchParams.set("pageSize", String(RESULTADOS_A_EVALUAR));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), USDA_TIMEOUT_MS);

    let data;
    try {
      const response = await this.fetchFn(url.toString(), {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ServicioExternoError(
          `USDA FoodData Central respondió con estado ${response.status}`,
        );
      }
      data = await response.json();
    } catch (error) {
      if (error instanceof ServicioExternoError) throw error;
      if (error.name === "AbortError") {
        throw new ServicioExternoError(
          "USDA FoodData Central no respondió a tiempo",
          504,
        );
      }
      throw new ServicioExternoError(
        "No se pudo conectar con USDA FoodData Central",
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!Array.isArray(data.foods) || data.foods.length === 0) return null;

    const elegido = elegirMejorResultado(nombreIngles, data.foods);
    if (!elegido) return null;
    const resultado = this._mapearAInfoNutricional(elegido);
    // Peso típico de una pieza según la IA (ej. manzana ≈ 180 g): el
    // nutriólogo lo revisa en el formulario si compra el alimento por unidad
    if (traduccion.gramosPorUnidad > 0) resultado.gramosPorUnidad = traduccion.gramosPorUnidad;
    return resultado;
  }

  // USDA está en inglés. Si la traducción falla (por ejemplo, por el límite
  // de consultas de Groq) no se busca con el nombre en español: USDA
  // devuelve coincidencias de texto sin relación ("papa" -> "PAPA JOHN'S
  // pizza"). Se lanza ServicioExternoError y el buscador combinado usa la
  // tabla USFQ.
  async _traducir(nombreAlimento) {
    try {
      const respuesta = await this.pedirCompletion([
        {
          role: "user",
          content: `Traduce este alimento al inglés tal como se describe en USDA FoodData Central (SR Legacy), sin marca, en la forma en que normalmente se compra: crudo si es fruta, verdura, carne, grano o legumbre (por ejemplo "manzana" = "Apples, raw, with skin", "arroz" = "Rice, white, long-grain, regular, raw", "avena" = "Oats, whole grain, rolled"). Si el nombre es genérico, usa el alimento más común en Ecuador ("carne" = "Beef", "plátano" = "Plantains, green, raw", "frijoles" = "Beans, kidney, mature seeds, raw"). Para alimentos andinos usa su nombre en inglés aunque USDA no lo tenga ("tomate de árbol" = "Tamarillo, raw", "chocho" = "Lupins, mature seeds, raw", "mote" = "Hominy, white"). Además estima "gramosPorUnidad": el peso típico en gramos de la parte comestible de UNA unidad o pieza tal como se compra en Ecuador (ej. manzana 180, huevo 50, guineo 120, plátano verde 250, lata de atún escurrido 120, aguacate 150, lechuga 400); usa null si el alimento no se vende por piezas (arroz, harina, leche). Alimento: "${nombreAlimento}". Responde SOLO un JSON con este formato exacto: {"nombreIngles": "...", "gramosPorUnidad": <número o null>}`,
        },
      ], { tarea: "traduccion", temperature: 0 });
      const { nombreIngles, gramosPorUnidad } = JSON.parse(respuesta);
      if (nombreIngles && nombreIngles.trim().length > 0) {
        const gramos = Number(gramosPorUnidad);
        return {
          nombreIngles: nombreIngles.trim(),
          ...(gramos > 0 && gramos < 5000 && { gramosPorUnidad: Math.round(gramos) }),
        };
      }
    } catch {
      // se informa abajo
    }
    throw new ServicioExternoError(
      "No se pudo traducir el alimento para buscarlo en USDA",
    );
  }

  _mapearAInfoNutricional(food) {
    const resultado = { fuente: "USDA", refUnidad: "g", refCantidad: 100 };
    if (food.description) resultado.nombreEncontrado = food.description;
    resultado.tipoMedicion = esAlimentoLiquido(food.description)
      ? "volumen"
      : "peso";

    for (const nutriente of food.foodNutrients || []) {
      const campo = NOMBRES_ENERGIA.has(nutriente.nutrientName)
        ? nutriente.unitName?.toUpperCase() === "KCAL"
          ? "calorias"
          : null
        : MAPEO_NUTRIENTES[nutriente.nutrientName];
      if (!campo || resultado[campo] !== undefined) continue;
      if (typeof nutriente.value === "number" && nutriente.value >= 0) {
        resultado[campo] = nutriente.value;
      }
    }

    return resultado;
  }
}

module.exports = BuscadorNutricionalUSDA;
module.exports.elegirMejorResultado = elegirMejorResultado;

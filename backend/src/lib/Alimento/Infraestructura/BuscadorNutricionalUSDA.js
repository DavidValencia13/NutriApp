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
const MAPEO_NUTRIENTES = {
  Energy: "calorias",
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
    const nombreIngles =
      BUSQUEDAS_ESPECIFICAS[nombreNormalizado] ||
      (await this._traducir(nombreAlimento));

    const url = new URL(USDA_SEARCH_URL);
    url.searchParams.set("api_key", process.env.USDA_FDC_API_KEY);
    url.searchParams.set("query", nombreIngles);
    url.searchParams.set("dataType", "Foundation,SR Legacy");
    url.searchParams.set("pageSize", "3");

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

    return this._mapearAInfoNutricional(data.foods[0]);
  }

  async _traducir(nombreAlimento) {
    try {
      const respuesta = await this.pedirCompletion([
        {
          role: "user",
          content: `Traduce este alimento al inglés (nombre genérico corto, sin marca): "${nombreAlimento}". Responde SOLO un JSON con este formato exacto: {"nombreIngles": "..."}`,
        },
      ]);
      const { nombreIngles } = JSON.parse(respuesta);
      if (nombreIngles && nombreIngles.trim().length > 0)
        return nombreIngles.trim();
    } catch {
      // Si la traducción falla, se intenta buscar igual con el nombre
      // original — USDA a veces encuentra coincidencias en español para
      // alimentos comunes. No vale la pena bloquear la búsqueda por esto.
    }
    return nombreAlimento;
  }

  _mapearAInfoNutricional(food) {
    const resultado = { refUnidad: "g", refCantidad: 100 };
    if (food.description) resultado.nombreEncontrado = food.description;
    resultado.tipoMedicion = esAlimentoLiquido(food.description)
      ? "volumen"
      : "peso";

    for (const nutriente of food.foodNutrients || []) {
      const campo = MAPEO_NUTRIENTES[nutriente.nutrientName];
      if (!campo || resultado[campo] !== undefined) continue;
      if (typeof nutriente.value === "number" && nutriente.value >= 0) {
        resultado[campo] = nutriente.value;
      }
    }

    return resultado;
  }
}

module.exports = BuscadorNutricionalUSDA;

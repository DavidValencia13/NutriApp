/**
 * BORRADOR — catálogo curado de alimentos por grupo alimenticio.
 *
 * ESTADO: sin revisar, sin conectar al flujo productivo. No lo importa
 * ningún archivo de backend/ ni frontend/. Existe solo para que un
 * nutricionista (o el usuario del proyecto) lo revise antes de usarse.
 *
 * Generado por IA a partir de conocimiento general de alimentos comunes en
 * Ecuador/Latinoamérica. NO es una recomendación clínica ni nutricional
 * validada. No contiene precios, porciones recomendadas ni afirmaciones de
 * aptitud clínica ("apto para diabéticos", etc.) — eso queda fuera de
 * alcance hasta que exista una regla revisada por un profesional.
 *
 * QUÉ REVISAR ANTES DE USARLO EN PRODUCCIÓN:
 *   1. Nombres: ¿son los que usaría un nutriólogo ecuatoriano/latam?
 *   2. grupoPrincipal / gruposAlimenticios: ¿son correctos? (cada alimento
 *      los define explícitamente a mano, no se derivan de ninguna regla)
 *   3. atributos: vocabulario deliberadamente pequeño y conservador
 *      (vegetariano, vegano, sin_gluten, sin_lacteos). Si algo no se marcó,
 *      es porque no había certeza razonable, no porque se evaluó y descartó.
 *   4. terminosBusquedaUsda: términos en inglés plausibles para USDA
 *      FoodData Central — no verificados contra la API real, revisar que
 *      efectivamente devuelvan una coincidencia razonable.
 *   5. Cobertura: faltan por completo "procesados" y "suplementos" —
 *      decisión deliberada, ver nota al final del archivo.
 *   6. Agregar/quitar entradas según lo que realmente registren los
 *      nutriólogos que usan la app (esta lista es un punto de partida, no
 *      un catálogo cerrado).
 *
 * SCHEMA de cada entrada:
 *   id                    string única, kebab-case
 *   nombre                string, nombre para mostrar y prellenar en el form
 *   grupoPrincipal        uno de GRUPOS_ALIMENTICIOS — filtro inicial para
 *                         decidir en qué lista aparece el alimento; NO es
 *                         una clasificación nutricional definitiva por sí
 *                         sola (ver gruposAlimenticios)
 *   gruposAlimenticios    array explícito de TODOS los grupos a los que
 *                         pertenece el alimento (puede incluir más de uno,
 *                         ej. legumbres también cuenta como proteína) —
 *                         cada entrada lo declara a mano, no se infiere de
 *                         ninguna tabla de "alternativas" del evaluador
 *   terminosBusquedaUsda  array de términos en inglés para buscar en USDA
 *                         FoodData Central
 *   atributos             array de un vocabulario fijo y conservador:
 *                         "vegetariano" | "vegano" | "sin_gluten" |
 *                         "sin_lacteos" — ausencia de un atributo NO
 *                         implica que el alimento lo contradiga, solo que
 *                         no hubo certeza razonable para marcarlo
 *   incompatibilidades    reservado para incompatibilidades explícitas más
 *                         allá del filtrado por atributos/alergias —
 *                         vacío en este borrador
 *   activo                boolean; permite desactivar una entrada sin
 *                         borrarla una vez que el catálogo esté en uso
 */

const CATALOGO_ALIMENTOS_BORRADOR = [
  // ---- Proteínas ----
  {
    id: "pechuga-pollo",
    nombre: "Pechuga de pollo",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["chicken breast, cooked", "chicken breast, raw"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "carne-res-magra",
    nombre: "Carne de res (magra)",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["beef, lean, cooked"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pescado-tilapia",
    nombre: "Pescado (tilapia)",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["tilapia, cooked", "fish, tilapia, raw"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "atun-agua",
    nombre: "Atún (enlatado en agua)",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["tuna, canned in water, drained"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "huevo",
    nombre: "Huevo",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["egg, whole, cooked"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "camaron",
    nombre: "Camarón",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["shrimp, cooked"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "cerdo-lomo",
    nombre: "Cerdo (lomo)",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["pork loin, cooked"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pavo",
    nombre: "Pavo",
    grupoPrincipal: "proteinas",
    gruposAlimenticios: ["proteinas"],
    terminosBusquedaUsda: ["turkey breast, cooked"],
    atributos: [],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Legumbres (varias también cuentan como proteína) ----
  {
    id: "lenteja",
    nombre: "Lenteja",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["lentils, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "garbanzo",
    nombre: "Garbanzo",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["chickpeas, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "frejol-negro",
    nombre: "Fréjol negro",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["beans, black, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "frejol-rojo",
    nombre: "Fréjol rojo",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["beans, kidney, red, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "arveja-seca",
    nombre: "Arveja seca",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["peas, split, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "haba",
    nombre: "Haba",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["fava beans, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "chocho",
    nombre: "Chocho (lupino andino)",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["lupini beans, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "soya-grano",
    nombre: "Soya (grano)",
    grupoPrincipal: "legumbres",
    gruposAlimenticios: ["legumbres", "proteinas"],
    terminosBusquedaUsda: ["soybeans, mature, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Carbohidratos (raíces y tubérculos) ----
  {
    id: "papa",
    nombre: "Papa",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["potato, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "yuca",
    nombre: "Yuca",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["cassava, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "camote",
    nombre: "Camote",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["sweet potato, cooked, boiled"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "platano-verde",
    nombre: "Plátano verde",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["plantains, green, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "platano-maduro",
    nombre: "Plátano maduro",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["plantains, ripe, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "melloco",
    nombre: "Melloco (ulluco)",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["ulluco, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "zanahoria-blanca",
    nombre: "Zanahoria blanca (arracacha)",
    grupoPrincipal: "carbohidratos",
    gruposAlimenticios: ["carbohidratos"],
    terminosBusquedaUsda: ["arracacha, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Granos y cereales ----
  {
    id: "arroz-blanco",
    nombre: "Arroz blanco",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["rice, white, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "arroz-integral",
    nombre: "Arroz integral",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["rice, brown, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "avena",
    nombre: "Avena",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["oatmeal, cooked"],
    // Sin "sin_gluten": la avena es naturalmente libre de gluten pero suele
    // venir contaminada cruzadamente — no se marca para ser conservadores.
    atributos: ["vegetariano", "vegano", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "quinua",
    nombre: "Quinua",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales", "proteinas"],
    terminosBusquedaUsda: ["quinoa, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "choclo",
    nombre: "Choclo (maíz tierno)",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["corn, sweet, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pan-integral",
    nombre: "Pan integral",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["bread, whole wheat"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pasta",
    nombre: "Pasta / fideo",
    grupoPrincipal: "granos_cereales",
    gruposAlimenticios: ["granos_cereales"],
    terminosBusquedaUsda: ["pasta, cooked"],
    atributos: ["vegetariano", "vegano"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Frutas ----
  {
    id: "banano",
    nombre: "Banano",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["banana, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "manzana",
    nombre: "Manzana",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["apple, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "naranja",
    nombre: "Naranja",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["orange, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "papaya",
    nombre: "Papaya",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["papaya, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pina",
    nombre: "Piña",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["pineapple, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "mango",
    nombre: "Mango",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["mango, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "maracuya",
    nombre: "Maracuyá",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["passion fruit, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "mora",
    nombre: "Mora",
    grupoPrincipal: "frutas",
    gruposAlimenticios: ["frutas"],
    terminosBusquedaUsda: ["blackberries, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Verduras y hortalizas ----
  {
    id: "tomate",
    nombre: "Tomate",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["tomato, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "lechuga",
    nombre: "Lechuga",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["lettuce, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "brocoli",
    nombre: "Brócoli",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["broccoli, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "espinaca",
    nombre: "Espinaca",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["spinach, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "zanahoria",
    nombre: "Zanahoria",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["carrots, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "pimiento",
    nombre: "Pimiento (pimentón)",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["peppers, sweet, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "cebolla",
    nombre: "Cebolla",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["onions, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "zapallo",
    nombre: "Zapallo (calabaza)",
    grupoPrincipal: "verduras_hortalizas",
    gruposAlimenticios: ["verduras_hortalizas"],
    terminosBusquedaUsda: ["squash, winter, cooked"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Lácteos ----
  {
    id: "leche-entera",
    nombre: "Leche entera",
    grupoPrincipal: "lacteos",
    gruposAlimenticios: ["lacteos"],
    terminosBusquedaUsda: ["milk, whole"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "leche-descremada",
    nombre: "Leche descremada",
    grupoPrincipal: "lacteos",
    gruposAlimenticios: ["lacteos"],
    terminosBusquedaUsda: ["milk, nonfat, skim"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "yogur-natural",
    nombre: "Yogur natural",
    grupoPrincipal: "lacteos",
    gruposAlimenticios: ["lacteos"],
    terminosBusquedaUsda: ["yogurt, plain"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "queso-fresco",
    nombre: "Queso fresco",
    grupoPrincipal: "lacteos",
    gruposAlimenticios: ["lacteos", "proteinas"],
    terminosBusquedaUsda: ["cheese, fresh, queso fresco"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "queso-maduro",
    nombre: "Queso maduro",
    grupoPrincipal: "lacteos",
    gruposAlimenticios: ["lacteos", "proteinas"],
    terminosBusquedaUsda: ["cheese, cheddar"],
    atributos: ["vegetariano"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Grasas saludables ----
  {
    id: "aguacate",
    nombre: "Aguacate",
    grupoPrincipal: "grasas_saludables",
    gruposAlimenticios: ["grasas_saludables"],
    terminosBusquedaUsda: ["avocado, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "aceite-oliva",
    nombre: "Aceite de oliva",
    grupoPrincipal: "grasas_saludables",
    gruposAlimenticios: ["grasas_saludables"],
    terminosBusquedaUsda: ["olive oil"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "aceite-girasol",
    nombre: "Aceite de girasol",
    grupoPrincipal: "grasas_saludables",
    gruposAlimenticios: ["grasas_saludables"],
    terminosBusquedaUsda: ["sunflower oil"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "aceitunas",
    nombre: "Aceitunas",
    grupoPrincipal: "grasas_saludables",
    gruposAlimenticios: ["grasas_saludables"],
    terminosBusquedaUsda: ["olives, ripe"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "coco-fresco",
    nombre: "Coco fresco",
    grupoPrincipal: "grasas_saludables",
    gruposAlimenticios: ["grasas_saludables"],
    terminosBusquedaUsda: ["coconut, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Frutos secos y semillas ----
  {
    id: "mani",
    nombre: "Maní",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["peanuts, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "almendras",
    nombre: "Almendras",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["almonds, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "nueces",
    nombre: "Nueces",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["walnuts, raw"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "chia",
    nombre: "Semillas de chía",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["chia seeds, dried"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "linaza",
    nombre: "Semillas de linaza",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["flaxseed"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "semillas-zapallo",
    nombre: "Semillas de zapallo",
    grupoPrincipal: "frutos_secos_semillas",
    gruposAlimenticios: ["frutos_secos_semillas"],
    terminosBusquedaUsda: ["pumpkin seeds"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Bebidas ----
  // Deliberadamente conservador: solo bebidas sin azúcar añadida. No se
  // incluyen gaseosas ni bebidas azucaradas — el propio evaluador de
  // cobertura ya advierte contra el exceso de procesados, no tendría
  // sentido sugerirlas activamente desde el catálogo curado.
  {
    id: "agua",
    nombre: "Agua",
    grupoPrincipal: "bebidas",
    gruposAlimenticios: ["bebidas"],
    terminosBusquedaUsda: ["water, tap"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "agua-coco",
    nombre: "Agua de coco",
    grupoPrincipal: "bebidas",
    gruposAlimenticios: ["bebidas"],
    terminosBusquedaUsda: ["coconut water"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "te-sin-azucar",
    nombre: "Té (sin azúcar)",
    grupoPrincipal: "bebidas",
    gruposAlimenticios: ["bebidas"],
    terminosBusquedaUsda: ["tea, black, brewed"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "cafe-sin-azucar",
    nombre: "Café (sin azúcar)",
    grupoPrincipal: "bebidas",
    gruposAlimenticios: ["bebidas"],
    terminosBusquedaUsda: ["coffee, brewed"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },
  {
    id: "jugo-natural-sin-azucar",
    nombre: "Jugo natural (sin azúcar añadida)",
    grupoPrincipal: "bebidas",
    gruposAlimenticios: ["bebidas"],
    terminosBusquedaUsda: ["fruit juice, 100%, no sugar added"],
    atributos: ["vegetariano", "vegano", "sin_gluten", "sin_lacteos"],
    incompatibilidades: [],
    activo: true,
  },

  // ---- Procesados y Suplementos: sin curar en este borrador ----
  // "procesados": curar una lista "recomendada" de procesados choca con lo
  // que el propio evaluador de cobertura ya advierte activamente (alerta
  // "exceso_procesados"). No tiene sentido que el catálogo empuje hacia
  // algo que el resto del sistema desalienta. Se deja vacío a propósito;
  // "Otro alimento" sigue cubriendo el registro de procesados puntuales.
  //
  // "suplementos": requiere criterio clínico (dosis, indicación, interacción
  // con medicamentos) que está fuera de lo que este catálogo debe decidir.
  // Queda pendiente de una decisión explícita de un nutricionista sobre si
  // curar suplementos tiene sentido en este catálogo o debe manejarse aparte.
];

module.exports = { CATALOGO_ALIMENTOS_BORRADOR };

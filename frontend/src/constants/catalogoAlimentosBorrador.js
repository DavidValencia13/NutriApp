// BORRADOR — copia en el frontend de docs/alimentos/catalogo-alimentos-borrador.js
// para poder usarlo en el selector de alimentos por grupo. Sin revisar por
// un nutricionista: nombres, grupos y atributos son un punto de partida
// razonable, no una recomendación clínica validada. Cualquier alimento
// elegido desde aquí se marca en el formulario como sugerencia sin validar.
export const CATALOGO_ALIMENTOS_BORRADOR = [
  // ---- Proteínas ----
  { id: "pechuga-pollo", nombre: "Pechuga de pollo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "carne-res-magra", nombre: "Carne de res (magra)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "pescado-tilapia", nombre: "Pescado (tilapia)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "atun-agua", nombre: "Atún (enlatado en agua)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "huevo", nombre: "Huevo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "camaron", nombre: "Camarón", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "cerdo-lomo", nombre: "Cerdo (lomo)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },
  { id: "pavo", nombre: "Pavo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] },

  // ---- Legumbres ----
  { id: "lenteja", nombre: "Lenteja", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "garbanzo", nombre: "Garbanzo", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "frejol-negro", nombre: "Fréjol negro", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "frejol-rojo", nombre: "Fréjol rojo", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "arveja-seca", nombre: "Arveja seca", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "haba", nombre: "Haba", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "chocho", nombre: "Chocho (lupino andino)", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },
  { id: "soya-grano", nombre: "Soya (grano)", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] },

  // ---- Carbohidratos ----
  { id: "papa", nombre: "Papa", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "yuca", nombre: "Yuca", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "camote", nombre: "Camote", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "platano-verde", nombre: "Plátano verde", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "platano-maduro", nombre: "Plátano maduro", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "melloco", nombre: "Melloco (ulluco)", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },
  { id: "zanahoria-blanca", nombre: "Zanahoria blanca (arracacha)", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] },

  // ---- Granos y cereales ----
  { id: "arroz-blanco", nombre: "Arroz blanco", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },
  { id: "arroz-integral", nombre: "Arroz integral", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },
  { id: "avena", nombre: "Avena", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },
  { id: "quinua", nombre: "Quinua", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales", "proteinas"] },
  { id: "choclo", nombre: "Choclo (maíz tierno)", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },
  { id: "pan-integral", nombre: "Pan integral", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },
  { id: "pasta", nombre: "Pasta / fideo", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] },

  // ---- Frutas ----
  { id: "banano", nombre: "Banano", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "manzana", nombre: "Manzana", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "naranja", nombre: "Naranja", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "papaya", nombre: "Papaya", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "pina", nombre: "Piña", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "mango", nombre: "Mango", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "maracuya", nombre: "Maracuyá", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },
  { id: "mora", nombre: "Mora", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] },

  // ---- Verduras y hortalizas ----
  { id: "tomate", nombre: "Tomate", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "lechuga", nombre: "Lechuga", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "brocoli", nombre: "Brócoli", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "espinaca", nombre: "Espinaca", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "zanahoria", nombre: "Zanahoria", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "pimiento", nombre: "Pimiento (pimentón)", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "cebolla", nombre: "Cebolla", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },
  { id: "zapallo", nombre: "Zapallo (calabaza)", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] },

  // ---- Lácteos ----
  { id: "leche-entera", nombre: "Leche entera", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] },
  { id: "leche-descremada", nombre: "Leche descremada", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] },
  { id: "yogur-natural", nombre: "Yogur natural", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] },
  { id: "queso-fresco", nombre: "Queso fresco", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos", "proteinas"] },
  { id: "queso-maduro", nombre: "Queso maduro", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos", "proteinas"] },

  // ---- Grasas saludables ----
  { id: "aguacate", nombre: "Aguacate", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] },
  { id: "aceite-oliva", nombre: "Aceite de oliva", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] },
  { id: "aceite-girasol", nombre: "Aceite de girasol", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] },
  { id: "aceitunas", nombre: "Aceitunas", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] },
  { id: "coco-fresco", nombre: "Coco fresco", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] },

  // ---- Frutos secos y semillas ----
  { id: "mani", nombre: "Maní", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },
  { id: "almendras", nombre: "Almendras", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },
  { id: "nueces", nombre: "Nueces", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },
  { id: "chia", nombre: "Semillas de chía", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },
  { id: "linaza", nombre: "Semillas de linaza", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },
  { id: "semillas-zapallo", nombre: "Semillas de zapallo", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] },

  // ---- Bebidas ----
  { id: "agua", nombre: "Agua", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] },
  { id: "agua-coco", nombre: "Agua de coco", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] },
  { id: "te-sin-azucar", nombre: "Té (sin azúcar)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] },
  { id: "cafe-sin-azucar", nombre: "Café (sin azúcar)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] },
  { id: "jugo-natural-sin-azucar", nombre: "Jugo natural (sin azúcar añadida)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] },

  // "procesados" y "suplementos" quedan sin curar a propósito — ver
  // docs/alimentos/catalogo-alimentos-borrador.js para la explicación.
];

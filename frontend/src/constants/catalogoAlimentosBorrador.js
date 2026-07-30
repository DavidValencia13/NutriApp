// BORRADOR — copia en el frontend de docs/alimentos/catalogo-alimentos-borrador.js
// para poder usarlo en el selector de alimentos por grupo. Sin revisar por
// un nutricionista: nombres, grupos y atributos son un punto de partida
// razonable, no una recomendación clínica validada. Cualquier alimento
// elegido desde aquí se marca en el formulario como sugerencia sin validar.
export const CATALOGO_ALIMENTOS_BORRADOR = [
  // ---- Proteínas ----
  { id: "pechuga-pollo", nombre: "Pechuga de pollo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["chicken breast, cooked","chicken breast, raw"]},
  { id: "carne-res-magra", nombre: "Carne de res (magra)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["beef, lean, cooked"]},
  { id: "pescado-tilapia", nombre: "Pescado (tilapia)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["tilapia, cooked","fish, tilapia, raw"]},
  { id: "atun-agua", nombre: "Atún (enlatado en agua)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["tuna, canned in water, drained"]},
  { id: "huevo", nombre: "Huevo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["egg, whole, cooked"]},
  { id: "camaron", nombre: "Camarón", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["shrimp, cooked"]},
  { id: "cerdo-lomo", nombre: "Cerdo (lomo)", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["pork loin, cooked"]},
  { id: "pavo", nombre: "Pavo", grupoPrincipal: "proteinas", gruposAlimenticios: ["proteinas"] , terminosBusquedaUsda: ["turkey breast, cooked"]},

  // ---- Legumbres ----
  { id: "lenteja", nombre: "Lenteja", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["lentils, cooked, boiled"]},
  { id: "garbanzo", nombre: "Garbanzo", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["chickpeas, cooked, boiled"]},
  { id: "frejol-negro", nombre: "Fréjol negro", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["beans, black, cooked, boiled"]},
  { id: "frejol-rojo", nombre: "Fréjol rojo", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["beans, kidney, red, cooked, boiled"]},
  { id: "arveja-seca", nombre: "Arveja seca", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["peas, split, cooked, boiled"]},
  { id: "haba", nombre: "Haba", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["fava beans, cooked, boiled"]},
  { id: "chocho", nombre: "Chocho (lupino andino)", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["lupini beans, cooked"]},
  { id: "soya-grano", nombre: "Soya (grano)", grupoPrincipal: "legumbres", gruposAlimenticios: ["legumbres", "proteinas"] , terminosBusquedaUsda: ["soybeans, mature, cooked, boiled"]},

  // ---- Carbohidratos ----
  { id: "papa", nombre: "Papa", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["potato, cooked, boiled"]},
  { id: "yuca", nombre: "Yuca", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["cassava, cooked"]},
  { id: "camote", nombre: "Camote", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["sweet potato, cooked, boiled"]},
  { id: "platano-verde", nombre: "Plátano verde", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["plantains, green, cooked"]},
  { id: "platano-maduro", nombre: "Plátano maduro", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["plantains, ripe, cooked"]},
  { id: "melloco", nombre: "Melloco (ulluco)", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["ulluco, cooked"]},
  { id: "zanahoria-blanca", nombre: "Zanahoria blanca (arracacha)", grupoPrincipal: "carbohidratos", gruposAlimenticios: ["carbohidratos"] , terminosBusquedaUsda: ["arracacha, cooked"]},

  // ---- Granos y cereales ----
  { id: "arroz-blanco", nombre: "Arroz blanco", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["rice, white, cooked"]},
  { id: "arroz-integral", nombre: "Arroz integral", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["rice, brown, cooked"]},
  { id: "avena", nombre: "Avena", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["oatmeal, cooked"]},
  { id: "quinua", nombre: "Quinua", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales", "proteinas"] , terminosBusquedaUsda: ["quinoa, cooked"]},
  { id: "choclo", nombre: "Choclo (maíz tierno)", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["corn, sweet, cooked"]},
  { id: "pan-integral", nombre: "Pan integral", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["bread, whole wheat"]},
  { id: "pasta", nombre: "Pasta / fideo", grupoPrincipal: "granos_cereales", gruposAlimenticios: ["granos_cereales"] , terminosBusquedaUsda: ["pasta, cooked"]},

  // ---- Frutas ----
  { id: "banano", nombre: "Banano", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["banana, raw"]},
  { id: "manzana", nombre: "Manzana", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["apple, raw"]},
  { id: "naranja", nombre: "Naranja", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["orange, raw"]},
  { id: "papaya", nombre: "Papaya", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["papaya, raw"]},
  { id: "pina", nombre: "Piña", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["pineapple, raw"]},
  { id: "mango", nombre: "Mango", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["mango, raw"]},
  { id: "maracuya", nombre: "Maracuyá", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["passion fruit, raw"]},
  { id: "mora", nombre: "Mora", grupoPrincipal: "frutas", gruposAlimenticios: ["frutas"] , terminosBusquedaUsda: ["blackberries, raw"]},

  // ---- Verduras y hortalizas ----
  { id: "tomate", nombre: "Tomate", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["tomato, raw"]},
  { id: "lechuga", nombre: "Lechuga", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["lettuce, raw"]},
  { id: "brocoli", nombre: "Brócoli", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["broccoli, cooked"]},
  { id: "espinaca", nombre: "Espinaca", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["spinach, cooked"]},
  { id: "zanahoria", nombre: "Zanahoria", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["carrots, raw"]},
  { id: "pimiento", nombre: "Pimiento (pimentón)", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["peppers, sweet, raw"]},
  { id: "cebolla", nombre: "Cebolla", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["onions, raw"]},
  { id: "zapallo", nombre: "Zapallo (calabaza)", grupoPrincipal: "verduras_hortalizas", gruposAlimenticios: ["verduras_hortalizas"] , terminosBusquedaUsda: ["squash, winter, cooked"]},

  // ---- Lácteos ----
  { id: "leche-entera", nombre: "Leche entera", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] , terminosBusquedaUsda: ["milk, whole"], tipoMedida: "volumen"},
  { id: "leche-descremada", nombre: "Leche descremada", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] , terminosBusquedaUsda: ["milk, nonfat, skim"], tipoMedida: "volumen"},
  { id: "yogur-natural", nombre: "Yogur natural", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos"] , terminosBusquedaUsda: ["yogurt, plain"]},
  { id: "queso-fresco", nombre: "Queso fresco", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos", "proteinas"] , terminosBusquedaUsda: ["cheese, fresh, queso fresco"]},
  { id: "queso-maduro", nombre: "Queso maduro", grupoPrincipal: "lacteos", gruposAlimenticios: ["lacteos", "proteinas"] , terminosBusquedaUsda: ["cheese, cheddar"]},

  // ---- Grasas saludables ----
  { id: "aguacate", nombre: "Aguacate", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] , terminosBusquedaUsda: ["avocado, raw"]},
  { id: "aceite-oliva", nombre: "Aceite de oliva", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] , terminosBusquedaUsda: ["olive oil"], tipoMedida: "volumen"},
  { id: "aceite-girasol", nombre: "Aceite de girasol", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] , terminosBusquedaUsda: ["sunflower oil"], tipoMedida: "volumen"},
  { id: "aceitunas", nombre: "Aceitunas", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] , terminosBusquedaUsda: ["olives, ripe"]},
  { id: "coco-fresco", nombre: "Coco fresco", grupoPrincipal: "grasas_saludables", gruposAlimenticios: ["grasas_saludables"] , terminosBusquedaUsda: ["coconut, raw"]},

  // ---- Frutos secos y semillas ----
  { id: "mani", nombre: "Maní", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["peanuts, raw"]},
  { id: "almendras", nombre: "Almendras", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["almonds, raw"]},
  { id: "nueces", nombre: "Nueces", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["walnuts, raw"]},
  { id: "chia", nombre: "Semillas de chía", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["chia seeds, dried"]},
  { id: "linaza", nombre: "Semillas de linaza", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["flaxseed"]},
  { id: "semillas-zapallo", nombre: "Semillas de zapallo", grupoPrincipal: "frutos_secos_semillas", gruposAlimenticios: ["frutos_secos_semillas"] , terminosBusquedaUsda: ["pumpkin seeds"]},

  // ---- Bebidas ----
  { id: "agua", nombre: "Agua", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] , terminosBusquedaUsda: ["water, tap"], tipoMedida: "volumen"},
  { id: "agua-coco", nombre: "Agua de coco", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] , terminosBusquedaUsda: ["coconut water"], tipoMedida: "volumen"},
  { id: "te-sin-azucar", nombre: "Té (sin azúcar)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] , terminosBusquedaUsda: ["tea, black, brewed"], tipoMedida: "volumen"},
  { id: "cafe-sin-azucar", nombre: "Café (sin azúcar)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] , terminosBusquedaUsda: ["coffee, brewed"], tipoMedida: "volumen"},
  { id: "jugo-natural-sin-azucar", nombre: "Jugo natural (sin azúcar añadida)", grupoPrincipal: "bebidas", gruposAlimenticios: ["bebidas"] , terminosBusquedaUsda: ["fruit juice, 100%, no sugar added"], tipoMedida: "volumen"},

  // "procesados" y "suplementos" quedan sin curar a propósito — ver
  // docs/alimentos/catalogo-alimentos-borrador.js para la explicación.
];

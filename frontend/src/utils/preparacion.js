import { Blend, CookingPot, Droplets, Flame, Microwave, Salad, Slice, Soup, Utensils } from "lucide-react";

// Explicación de preparación de un plato: { pasos: [{ accion, texto, minutos }], minutosTotales }
// color: tono fuerte del ícono · fondo: círculo suave detrás
export const ACCIONES = {
  lavar: { Icono: Droplets, nombre: "Lavar", color: "#0284c7", fondo: "#e0f2fe" },
  picar: { Icono: Slice, nombre: "Picar", color: "#15803d", fondo: "#dcfce7" },
  hervir: { Icono: Soup, nombre: "Hervir", color: "#ea580c", fondo: "#ffedd5" },
  cocinar: { Icono: CookingPot, nombre: "Cocinar", color: "#b45309", fondo: "#fef3c7" },
  freir: { Icono: Flame, nombre: "Freír", color: "#dc2626", fondo: "#fee2e2" },
  hornear: { Icono: Microwave, nombre: "Al horno", color: "#9a3412", fondo: "#fed7aa" },
  licuar: { Icono: Blend, nombre: "Licuar", color: "#7c3aed", fondo: "#ede9fe" },
  mezclar: { Icono: Utensils, nombre: "Mezclar", color: "#0f766e", fondo: "#ccfbf1" },
  servir: { Icono: Salad, nombre: "Servir", color: "#db2777", fondo: "#fce7f3" },
};

export function accion(clave) {
  return ACCIONES[clave] || ACCIONES.cocinar;
}

// Dibujo (emoji) de cada alimento, por palabras de su nombre. Es solo
// decorativo (no usa IA): si no se reconoce se usa un plato genérico.
const EMOJIS = [
  [/huevo|clara/, "🥚"], [/pollo|gallina|pechuga|muslo/, "🍗"], [/carne|\bres\b|lomo|chuleta|cerdo|chancho/, "🥩"],
  [/atun|pescado|tilapia|corvina|sardina|camaron|marisco/, "🐟"], [/lenteja|frejol|frijol|haba|garbanzo|arveja|chocho|menestra/, "🫘"],
  [/arroz/, "🍚"], [/papa|yuca|camote/, "🥔"], [/avena|quinua|trigo|cebada|granola|mote|maiz|choclo/, "🌾"],
  [/\bpan\b|tostada/, "🍞"], [/fideo|pasta|tallarin/, "🍝"], [/leche|yogur/, "🥛"], [/queso/, "🧀"],
  [/platano|guineo|banano/, "🍌"], [/manzana/, "🍎"], [/naranja|mandarina/, "🍊"], [/limon/, "🍋"],
  [/fresa|frutilla|\bmoras?\b/, "🍓"], [/pina/, "🍍"], [/sandia/, "🍉"], [/papaya|mango|melon/, "🥭"], [/uva/, "🍇"], [/pera/, "🍐"],
  [/aguacate/, "🥑"], [/tomate/, "🍅"], [/zanahoria/, "🥕"], [/brocoli|coliflor/, "🥦"], [/pimiento|aji/, "🫑"],
  [/cebolla/, "🧅"], [/ajo/, "🧄"], [/lechuga|espinaca|acelga|\bcol\b|ensalada/, "🥬"], [/pepino|zucchini|zapallo/, "🥒"],
  [/aceite|manteca|mantequilla/, "🫒"], [/mani|nuez|almendra/, "🥜"], [/azucar|miel|panela/, "🍯"], [/agua/, "💧"],
];

function sinTildes(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function emojiDeAlimento(nombre) {
  const limpio = sinTildes(nombre);
  return EMOJIS.find(([patron]) => patron.test(limpio))?.[1] || "🍽️";
}

// Ingredientes del plato que se mencionan en el texto de un paso
export function ingredientesDelPaso(texto, detalles = []) {
  const limpio = sinTildes(texto);
  return detalles.filter((d) => {
    const palabra = sinTildes(d.nombreAlimento).split(/[\s,(]+/)[0];
    return palabra.length >= 3 && limpio.includes(palabra.slice(0, Math.max(3, palabra.length - 1)));
  });
}

export function tienePreparacion(comida) {
  return Boolean(comida?.preparacion?.pasos?.length);
}

// Bebida preparada (jugo, batido, colada): su preparación va con el plato
function bebidaPreparada(comida) {
  const n = comida?.bebidaNutricion;
  return Boolean(comida?.bebida && n && ((Number(n.nutrientes?.calorias) || 0) > 0 || n.ingredientes?.length));
}


// Pasos del plato y de la bebida por separado. Los nuevos vienen marcados
// (bebida: true); en explicaciones anteriores el paso empezaba con el
// nombre de la bebida ("Batido de guineo: coloca...").
export function separarPasos(comida) {
  const pasos = comida?.preparacion?.pasos || [];
  const nombre = sinTildes(comida?.bebida);
  // "Batido de guineo: coloca..." -> lo de antes de ":" es parte del nombre de la bebida
  const empiezaConBebida = (texto) => {
    const t = String(texto || "");
    const i = t.indexOf(":");
    const antes = i > 0 && i < 60 ? sinTildes(t.slice(0, i)).trim() : "";
    return antes.length >= 5 && (nombre.startsWith(antes) || antes.startsWith(nombre.slice(0, 12)));
  };
  const esDeBebida = (p) => p.bebida === true || Boolean(comida?.bebida && empiezaConBebida(p.texto));
  const conIndice = pasos.map((p, i) => ({ ...p, indice: i }));
  return { plato: conIndice.filter((p) => !esDeBebida(p)), bebida: conIndice.filter(esDeBebida) };
}

// Quita "Batido de guineo: " del inicio del texto (ya va en el título de la sección)
export function textoSinBebida(texto, bebida) {
  const t = String(texto || "");
  const i = t.indexOf(":");
  if (!(i > 0 && i < 60)) return t;
  const antes = sinTildes(t.slice(0, i)).trim();
  const nombre = sinTildes(bebida);
  if (antes.length < 5 || !(nombre.startsWith(antes) || antes.startsWith(nombre.slice(0, 12)))) return t;
  return t.slice(i + 1).trim().replace(/^./, (c) => c.toUpperCase());
}

// Falta explicación, o se hizo antes de ponerle la bebida preparada actual
export function necesitaPreparacion(comida) {
  if (!tienePreparacion(comida)) return true;
  return bebidaPreparada(comida) && comida.preparacion.bebida !== comida.bebida;
}

export function textoMinutos(minutos) {
  const m = Number(minutos) || 0;
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

// Devuelve una copia del menú con las preparaciones { [idComida]: prep }
export function aplicarPreparaciones(menu, preparaciones) {
  if (!menu) return menu;
  return {
    ...menu,
    dias: (menu.dias || []).map((dia) => ({
      ...dia,
      comidas: (dia.comidas || []).map((c) =>
        Object.prototype.hasOwnProperty.call(preparaciones, c.id) ? { ...c, preparacion: preparaciones[c.id] } : c,
      ),
    })),
  };
}

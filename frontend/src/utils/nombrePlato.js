// Copia de backend/src/lib/Menu/Dominio/Servicios/NombrePlato.js (la vista
// previa del nombre al ajustar una comida; el servidor aplica lo mismo al guardar)
// Nombre del plato siempre de acuerdo con sus ingredientes (sin IA):
// - si el nutricionista cambia un alimento (acelga -> espinaca), el nombre y
//   la descripción se actualizan;
// - si al nombre le falta un alimento que sí lleva (ej. el tomate de la
//   ensalada), se agrega: "... ensalada de acelga con tomate". Muchos
//   pacientes solo leen el nombre.
// Aceites, sal y agua no se nombran (se dan por parte de la preparación).

const NO_SE_NOMBRAN = /^(aceite|manteca|mantequilla|margarina|sal|agua|azucar|vinagre|condimento|comino|oregano|pimienta)/;

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// "Espinaca, cruda" -> "espinaca"; "Tomate riñón (fresco)" -> "tomate riñón"
export function nombreCorto(nombreAlimento) {
  return String(nombreAlimento || "").split(/[,(]/)[0].replace(/\s+/g, " ").trim().toLowerCase();
}

// Raíz de la palabra principal sin plural: "huevos" -> "huevo", "garbanzos" -> "garbanzo"
function raiz(palabra) {
  const p = normalizar(palabra);
  if (p.length > 4 && p.endsWith("es") && !/[aeiou]es$/.test(p)) return p.slice(0, -2);
  if (p.length > 3 && p.endsWith("s")) return p.slice(0, -1);
  return p;
}

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Palabra principal del alimento ("pechuga de pollo" -> "pollo"; "arroz blanco" -> "arroz")
export function palabraClave(nombreAlimento) {
  const corto = normalizar(nombreCorto(nombreAlimento));
  const de = corto.match(/^(?:pechuga|muslo|filete|lomo|carne|pierna)\s+de\s+(\w+)/);
  if (de) return de[1];
  return corto.split(" ")[0] || "";
}

function regexPalabra(clave) {
  const r = raiz(clave);
  return r.length >= 3 ? new RegExp(`\\b${escapar(r)}(?:s|es)?\\b`, "i") : null;
}

export function mencionaAlimento(texto, nombreAlimento) {
  const re = regexPalabra(palabraClave(nombreAlimento));
  return re ? re.test(normalizar(texto)) : true;
}

// Reemplaza una mención de "viejo" por "nuevo" respetando mayúscula inicial.
// Busca primero el nombre corto completo y si no, la palabra principal.
export function reemplazarAlimento(texto, viejo, nuevo) {
  if (!texto) return texto;
  const original = String(texto);
  const sinTildes = normalizar(original);
  const nuevoCorto = nombreCorto(nuevo);
  const candidatos = [normalizar(nombreCorto(viejo)), palabraClave(viejo)].filter((c) => c && c.length >= 3);
  for (const c of candidatos) {
    const resto = c.split(" ").slice(1).join(" ");
    const re = new RegExp(`\\b${escapar(raiz(c))}(?:s|es)?\\b${resto ? `(?:\\s+${escapar(resto)})?` : ""}`, "i");
    const m = re.exec(sinTildes);
    if (!m) continue;
    // la normalización conserva las posiciones (solo quita acentos combinados)
    const inicio = m.index;
    const fin = inicio + m[0].length;
    const reemplazo = /^[A-ZÁÉÍÓÚÑ]/.test(original.slice(inicio, inicio + 1))
      ? nuevoCorto.charAt(0).toUpperCase() + nuevoCorto.slice(1)
      : nuevoCorto;
    return original.slice(0, inicio) + reemplazo + original.slice(fin);
  }
  return original;
}

// Aplica al texto los cambios de ingredientes: los que salen se cambian por
// los que entran, en orden
export function actualizarPorCambios(texto, nombresAntes = [], nombresDespues = []) {
  if (!texto) return texto;
  const clavesDespues = new Set(nombresDespues.map(palabraClave));
  const clavesAntes = new Set(nombresAntes.map(palabraClave));
  const salen = nombresAntes.filter((n) => !clavesDespues.has(palabraClave(n)));
  const entran = nombresDespues.filter((n) => !clavesAntes.has(palabraClave(n)));
  let resultado = texto;
  salen.forEach((viejo, i) => {
    if (entran[i]) resultado = reemplazarAlimento(resultado, viejo, entran[i]);
  });
  return resultado;
}

// Agrega al nombre los alimentos que lleva y no menciona
export function completarNombre(nombrePlato, nombresAlimentos = []) {
  const nombre = String(nombrePlato || "").trim();
  if (!nombre) return nombre;
  const faltan = [];
  for (const n of nombresAlimentos) {
    const corto = nombreCorto(n);
    if (!corto || NO_SE_NOMBRAN.test(normalizar(corto))) continue;
    if (mencionaAlimento(nombre, n)) continue;
    if (faltan.some((f) => palabraClave(f) === palabraClave(corto))) continue;
    faltan.push(corto);
  }
  if (faltan.length === 0) return nombre;
  const lista = faltan.length === 1 ? faltan[0] : `${faltan.slice(0, -1).join(", ")} y ${faltan.at(-1)}`;
  // "...con arroz y ensalada de acelga" + "con tomate"; "Huevos con pan" + "y leche"
  const conectores = [...normalizar(nombre).matchAll(/\s(con|y)\s/g)];
  const conector = conectores.at(-1)?.[1] === "con" ? "y" : "con";
  const resultado = `${nombre} ${conector} ${lista}`;
  return resultado.length <= 250 ? resultado : nombre;
}


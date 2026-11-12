// Busca en la tabla USFQ (colección tabla_usfq) por nombre en español o en
// inglés (el catálogo de sugerencias busca con términos en inglés).
// Es conservador: solo acepta alimentos cuyo nombre contiene TODAS las
// palabras buscadas; ante la duda devuelve null en vez de un alimento
// parecido pero distinto.

const PALABRAS_VACIAS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "e", "en", "a", "al",
  "the", "of", "and",
]);

function tokens(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t && !PALABRAS_VACIAS.has(t));
}

// Singular/plural: "frijoles" ~ "frijol", "tomates" ~ "tomate". Se prueban
// las variantes sin "s" y sin "es" porque ninguna regla sola sirve para todo
function variantes(t) {
  const v = [t];
  if (t.length > 3 && t.endsWith("s")) v.push(t.slice(0, -1));
  if (t.length > 4 && t.endsWith("es")) v.push(t.slice(0, -2));
  return v;
}

function mismaPalabra(a, b) {
  const vb = variantes(b);
  return variantes(a).some((x) => vb.includes(x));
}

// Palabras de 5+ letras también coinciden como prefijo ("yogur" ~ "yogurt")
function coincide(q, t) {
  return mismaPalabra(q, t) || (q.length >= 5 && t.startsWith(q));
}

function cubreTodo(consulta, nombre) {
  return consulta.every((q) => nombre.some((t) => coincide(q, t)));
}

// Con una búsqueda general ("leche", "pollo") se prefiere la forma básica
// del alimento: se penalizan versiones procesadas, vísceras y partes, y se
// favorecen las formas crudas/frescas/enteras. Son prefijos de palabra.
const PROCESADO = [
  "polvo", "deshidratad", "evaporad", "enlatad", "chocolat", "azucarad",
  "frit", "preparad", "germinad", "precocid", "enriquecid", "corazon", "higado", "molleja", "clara", "yema",
  "codorniz", "pata", "curad", "powder", "dried", "fried", "canned",
  "heart", "liver",
];
const BASICO = [
  "crud", "fresc", "enter", "fluid", "gallina", "pechuga",
  "raw", "fresh", "whole", "fluid", "breast",
];

const cuenta = (nombre, prefijos) =>
  nombre.filter((t) => prefijos.some((p) => t.startsWith(p))).length;

// Elige la mejor coincidencia entre los alimentos de la tabla, o null.
// Preferencias, en orden: coincidencias exactas antes que por prefijo, que
// la primera palabra buscada sea la primera del
// nombre ("arroz blanco" -> "Arroz blanco, ..." antes que "Harina de arroz
// blanco"), que no sea un producto de marca (etiquetado nutricional), que
// no sea una versión procesada, que sea una forma básica y que el nombre
// sea lo más corto/genérico posible.
function elegirMejorCoincidencia(consulta, alimentos) {
  const q = tokens(consulta);
  if (q.length === 0) return null;

  let mejor = null;
  for (const al of alimentos) {
    for (const nombre of [tokens(al.nombre), tokens(al.nombreIngles)]) {
      if (nombre.length === 0 || !cubreTodo(q, nombre)) continue;
      // Lo que el usuario escribió no cuenta como penalización ni bono
      // ("leche en polvo" debe encontrar la leche en polvo)
      const resto = nombre.filter((t) => !q.some((x) => coincide(x, t)));
      // Coincidencias exactas antes que por prefijo ("yogur" ~ "yogurt" solo
      // si no hay nada exacto)
      const soloPrefijo = q.filter(
        (x) => !nombre.some((t) => mismaPalabra(t, x)),
      ).length;
      // Palabras del nombre que empiezan como la buscada pero son otra
      // ("carnero" al buscar "carne"): señal de que es otro alimento
      const parecidas = nombre.filter((t) =>
        q.some((x) => x.length >= 5 && t.startsWith(x) && !mismaPalabra(t, x)),
      ).length;
      const puntaje = [
        soloPrefijo,
        parecidas,
        coincide(q[0], nombre[0]) ? 0 : 1,
        al.codigoFuente === 7 ? 1 : 0,
        cuenta(resto, PROCESADO),
        -cuenta(resto, BASICO),
        nombre.length,
      ];
      if (!mejor || menorQue(puntaje, mejor.puntaje)) mejor = { al, puntaje };
    }
  }
  return mejor ? mejor.al : null;
}

function menorQue(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

class BuscadorNutricionalUSFQ {
  // cargarTabla: función que devuelve todos los alimentos de la tabla
  // (son ~1000, se leen una vez y quedan en memoria)
  constructor(cargarTabla) {
    this.cargarTabla = cargarTabla;
    this.tabla = null;
  }

  async buscar(nombreAlimento) {
    if (!this.tabla) {
      const tabla = await this.cargarTabla();
      // Tabla vacía = todavía no se ejecutó `npm run cargar:usfq`; no se
      // guarda en caché para que funcione apenas se cargue
      if (tabla.length === 0) return null;
      this.tabla = tabla;
    }

    const al = elegirMejorCoincidencia(nombreAlimento, this.tabla);
    if (!al) return null;

    return {
      fuente: "USFQ",
      nombreEncontrado: al.nombre,
      refUnidad: "g",
      refCantidad: 100,
      tipoMedicion: al.unidadBase === "ml" ? "volumen" : "peso",
      ...al.nutrientes,
    };
  }
}

module.exports = BuscadorNutricionalUSFQ;
module.exports.elegirMejorCoincidencia = elegirMejorCoincidencia;

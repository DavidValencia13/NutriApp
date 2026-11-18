// Genera las reglas de "Personalizar diseño": cada color verde escrito a mano en
// index.css se reemplaza por el color de marca del nutricionista (variables
// --marca-*), según qué tan claro u oscuro es. Solo aplica dentro de
// .dashboard-marca (pantalla del nutricionista) y .portal-marca (paciente).
// Uso: node scripts/gen-marca.cjs src/index.css  (pega la salida tras "/* marca generadas */")
//      node scripts/gen-marca.cjs src/index.css --bordes  (reglas de esquinas, tras "/* bordes generadas */")
const fs = require("fs");
const css = fs.readFileSync(process.argv[2], "utf8").replace(/\r\n/g, "\n");
const corte = css.indexOf("/* ===== COLOR DE MARCA");
const fuente = corte >= 0 ? css.slice(0, corte) : css.slice(0, css.indexOf("/* ===== MODO OSCURO"));

function quitarBloques(texto, inicio) {
  let salida = "", i = 0;
  while (i < texto.length) {
    const m = texto.slice(i).match(inicio);
    if (!m) { salida += texto.slice(i); break; }
    const pos = i + m.index;
    salida += texto.slice(i, pos);
    let j = texto.indexOf("{", pos), prof = 0;
    for (; j < texto.length; j++) {
      if (texto[j] === "{") prof++;
      else if (texto[j] === "}") { prof--; if (prof === 0) break; }
    }
    i = j + 1;
  }
  return salida;
}
let limpio = quitarBloques(fuente.replace(/\/\*[\s\S]*?\*\//g, ""), /@keyframes|@theme/);
limpio = limpio.replace(/@media[^{]*\{/g, "");

function rgb(color) {
  let m = color.match(/^#([0-9a-f]{3})$/i);
  if (m) return { c: m[1].split("").map((h) => parseInt(h + h, 16)), a: 1 };
  m = color.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) return { c: [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)), a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
  m = color.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { c: m.slice(1, 4).map(Number), a };
  }
  return null;
}

function esVerde([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return false;
  const sat = (max - min) / max;
  if (sat < 0.18 || max < 25) return false;
  let h;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  return h >= 85 && h <= 200; // verdes, turquesas y celestes de acento
}

function reemplazo(color, esTexto = false) {
  const d = rgb(color);
  if (!d || !esVerde(d.c)) return null;
  const [r, g, b] = d.c;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const max = Math.max(r, g, b), sat = (max - Math.min(r, g, b)) / max;
  let base;
  if (esTexto && l < 0.75) {
    // Texto: verdes grisáceos (texto secundario) quedan en gris con un toque
    // de marca; verdes vivos pasan al color principal/oscuro (legibles)
    if (sat < 0.42) base = l > 0.4 ? "color-mix(in srgb, var(--marca-oscuro) 22%, #6b7280)" : "color-mix(in srgb, var(--marca-oscuro) 45%, #374151)";
    else base = l > 0.3 ? "var(--marca-principal)" : "var(--marca-oscuro)";
    return d.a < 1 ? `color-mix(in srgb, ${base} ${Math.round(d.a * 100)}%, transparent)` : base;
  }
  if (l > 0.88) base = "color-mix(in srgb, var(--marca-principal) 7%, #fff)";
  else if (l > 0.7) base = "color-mix(in srgb, var(--marca-claro) 55%, #fff)";
  else if (l > 0.45) base = "var(--marca-claro)";
  else if (l > 0.18) base = "var(--marca-principal)";
  else base = "var(--marca-oscuro)";
  if (d.a < 1) return `color-mix(in srgb, ${base} ${Math.round(d.a * 100)}%, transparent)`;
  return base;
}

const COLOR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi;

// Esquinas: radios de 6 a 30 px pasan a rectas (4 px) o muy redondeadas (x1.7)
// Uso: node scripts/gen-marca.cjs src/index.css --bordes  (tras "/* bordes generadas */")
if (process.argv.includes("--bordes")) {
  const salida = [];
  const reB = /([^{}]+)\{([^{}]*)\}/g;
  let b;
  while ((b = reB.exec(limpio))) {
    const selector = b[1].trim();
    if (!selector || selector.startsWith("@") || /^(from|to|\d+%)/.test(selector) || /tema-oscuro|marca/.test(selector)) continue;
    const decl = b[2].split(";").map((x) => x.trim()).find((x) => /^border-radius\s*:/.test(x));
    if (!decl) continue;
    const px = decl.split(":")[1].trim().match(/^(\d+(?:\.\d+)?)px$/);
    if (!px) continue;
    const n = Number(px[1]);
    if (n < 6 || n > 30) continue;
    const pref = (clase) => selector.split(",").map((s) => `:where(.${clase}) ${s.trim()}`).join(", ");
    salida.push(`${pref("marca-bordes-rectos")} { border-radius: 4px; }`);
    salida.push(`${pref("marca-bordes-redondeados")} { border-radius: ${Math.round(n * 1.7)}px; }`);
  }
  console.log(salida.join("\n"));
  console.error(`${salida.length} reglas de bordes`);
  process.exit(0);
}
const OMITIR = /boton-preparacion|weekly-meal-prep|prep-|live-dot|esqueleto|tema-oscuro|marca/;

// Animaciones con verdes (brillos del asistente, etc.): se crea una copia
// "-marca" de cada @keyframes con los colores cambiados
const keyframesMarca = [];
const nombresMarca = new Set();
{
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, "");
  const reK = /@keyframes\s+([\w-]+)\s*\{/g;
  let k;
  while ((k = reK.exec(sinComentarios))) {
    let j = reK.lastIndex, prof = 1;
    for (; j < sinComentarios.length && prof > 0; j++) {
      if (sinComentarios[j] === "{") prof++;
      else if (sinComentarios[j] === "}") prof--;
    }
    const cuerpo = sinComentarios.slice(reK.lastIndex, j - 1);
    let cambio = false;
    const nuevo = cuerpo.replace(/([\w-]+)\s*:\s*([^;{}]+)/g, (decl, prop, valor) =>
      decl.replace(valor, valor.replace(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi, (c) => {
        const r = reemplazo(c, prop === "color");
        if (r) { cambio = true; return r; }
        return c;
      })));
    if (cambio) {
      nombresMarca.add(k[1]);
      keyframesMarca.push(`@keyframes ${k[1]}-marca {${nuevo}}`);
    }
  }
}
const reglas = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(limpio))) {
  const selector = m[1].trim();
  if (!selector || selector.startsWith("@") || OMITIR.test(selector) || /^(from|to|\d+%)/.test(selector)) continue;
  const salida = [];
  for (const d of m[2].split(";").map((x) => x.trim()).filter(Boolean)) {
    const k = d.indexOf(":");
    const prop = d.slice(0, k).trim();
    let valor = d.slice(k + 1).trim();
    if (prop.startsWith("--")) continue;
    let cambio = false;
    valor = valor.replace(COLOR, (c) => {
      const r = reemplazo(c, prop === "color" || prop === "fill" || prop === "stroke");
      if (r) { cambio = true; return r; }
      return c;
    });
    if (prop === "animation" || prop === "animation-name") {
      valor = valor.replace(/[w-]+/g, (nombre) => {
        if (nombresMarca.has(nombre)) { cambio = true; return `${nombre}-marca`; }
        return nombre;
      });
    }
    if (cambio) salida.push(`${prop}: ${valor}`);
  }
  if (salida.length) {
    const sel = selector.split(",").map((s) => `:where(.dashboard-marca, .portal-marca) ${s.trim()}`).join(", ");
    reglas.push(`${sel} { ${salida.join("; ")}; }`);
  }
}
console.log([...reglas, ...keyframesMarca].join("\n"));
console.error(`${reglas.length} reglas`);

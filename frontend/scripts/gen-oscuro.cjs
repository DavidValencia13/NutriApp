// Genera las reglas "generadas" del modo oscuro a partir de index.css: por cada
// regla con fondo claro, texto oscuro o borde claro crea su versión oscura.
// Uso: node scripts/gen-oscuro.cjs src/index.css  (pega la salida tras "/* generadas */")
const fs = require("fs");
const archivo = process.argv[2];
const css = fs.readFileSync(archivo, "utf8").replace(/\r\n/g, "\n");
const corte = css.indexOf("/* ===== MODO OSCURO");
const fuente = corte >= 0 ? css.slice(0, corte) : css;

function quitarBloques(texto, inicio) {
  // quita @keyframes y @theme completos
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
limpio = limpio.replace(/@media[^{]*\{/g, ""); // aplanar media (las reglas internas valen igual)

function luminancia(color) {
  color = color.trim().toLowerCase();
  let r, g, b;
  if (color === "white" || color === "#fff") return 1;
  let m = color.match(/^#([0-9a-f]{3})$/);
  if (m) [r, g, b] = m[1].split("").map((h) => parseInt(h + h, 16));
  m = color.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) [r, g, b] = [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
  m = color.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
  if (m) [r, g, b] = m.slice(1, 4).map(Number);
  if (r === undefined) return null;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  ultimaSaturacion = max === 0 ? 0 : (max - min) / max;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
let ultimaSaturacion = 0;
function saturacion(color) { luminancia(color); return ultimaSaturacion; }
const COLOR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\bwhite\b/gi;
function colores(valor) { return (valor.match(COLOR) || []).map(luminancia).filter((l) => l !== null); }

const OMITIR = /hero|rail|slide|primary-button|assistant|weekly-menu-approve|boton-preparacion|weekly-meal-prep|prep-|portal-header|portal-marca|menu-flow-food-heading|live-dot|toast|tour|esqueleto|progreso-indef|boton-generando/;
const reglas = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(limpio))) {
  const selector = m[1].trim();
  if (!selector || selector.startsWith("@") || OMITIR.test(selector) || /^(from|to|\d+%)/.test(selector)) continue;
  const decls = m[2].split(";").map((d) => d.trim()).filter(Boolean);
  const salida = [];
  for (const d of decls) {
    const k = d.indexOf(":");
    const prop = d.slice(0, k).trim(), valor = d.slice(k + 1).trim();
    if (/url\(/.test(valor)) continue;
    const ls = colores(valor);
    if (!ls.length) continue;
    if ((prop === "background" || prop === "background-color" || prop === "background-image") && ls.every((l) => l > 0.82)) {
      const pagina = /dashboard-page|portal-root|^body|^html/.test(selector);
      salida.push(`background: ${pagina ? "var(--oscuro-fondo)" : "var(--oscuro-tarjeta)"}`);
    } else if (prop === "color") {
      const l = ls[0];
      const sat = saturacion(valor.match(COLOR)[0]);
      if (l < 0.3) salida.push(sat > 0.45 && l > 0.1 ? "color: var(--oscuro-acento)" : "color: var(--oscuro-texto)");
      else if (l < 0.62) salida.push(sat > 0.3 ? "color: var(--oscuro-acento)" : "color: var(--oscuro-texto-suave)");
    } else if (/^border(-top|-bottom|-left|-right)?(-color)?$/.test(prop) && ls.every((l) => l > 0.75)) {
      salida.push(prop.endsWith("-color") ? `${prop}: var(--oscuro-borde)` : `${prop.replace(/-color$/, "")}-color: var(--oscuro-borde)`);
    } else if (prop === "box-shadow" && ls.every((l) => l > 0.85)) {
      salida.push("box-shadow: none");
    }
  }
  if (salida.length) {
    const sel = selector.split(",").map((s) => `:where(.tema-oscuro) ${s.trim()}`).join(", ");
    reglas.push(`${sel} { ${salida.join("; ")}; }`);
  }
}
console.log(reglas.join("\n"));
console.error(`${reglas.length} reglas`);

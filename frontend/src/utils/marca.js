// Paleta de "Personalizar diseño". Las claves deben coincidir con
// COLORES_MARCA del backend (Nutriologo/Aplicacion/PersonalizarMarca.js).
// También se acepta un color propio "#rrggbb".
// principal: botones y acentos · oscuro: menú lateral y encabezado · claro: detalles
export const PALETA_MARCA = {
  verde: { nombre: "Verde NutriApp", principal: "#1F7A52", oscuro: "#0F3D33", claro: "#7BE0B0" },
  azul: { nombre: "Azul confianza", principal: "#1D5FA8", oscuro: "#0F2747", claro: "#93C5FD" },
  turquesa: { nombre: "Turquesa", principal: "#0E7C80", oscuro: "#0B3033", claro: "#7FE3E0" },
  morado: { nombre: "Morado", principal: "#6D3FB0", oscuro: "#2A1748", claro: "#C4B5FD" },
  rosa: { nombre: "Rosa", principal: "#B83A72", oscuro: "#3D1428", claro: "#F9A8D4" },
  naranja: { nombre: "Naranja", principal: "#C2570C", oscuro: "#3E1D08", claro: "#FDBA74" },
  gris: { nombre: "Gris elegante", principal: "#475569", oscuro: "#1E293B", claro: "#CBD5E1" },
};

export const ESTILOS_ENCABEZADO = {
  degradado: "Degradado",
  solido: "Sólido",
  ondas: "Con ondas",
};

// Opciones de diseño general (deben coincidir con OPCIONES del backend)
export const OPCIONES_DISENO = {
  tipografia: {
    moderna: { nombre: "Moderna", fuente: "'DM Sans', system-ui, sans-serif" },
    clasica: { nombre: "Clásica", fuente: "'Lora', Georgia, serif" },
    redondeada: { nombre: "Redondeada", fuente: "'Nunito', system-ui, sans-serif" },
  },
  bordes: {
    suaves: { nombre: "Suaves", radio: 12 },
    rectos: { nombre: "Rectas", radio: 4 },
    redondeados: { nombre: "Muy redondeadas", radio: 22 },
  },
  fondo: {
    decorado: { nombre: "Decorado" },
    liso: { nombre: "Liso" },
  },
};

// Clases que aplican el diseño elegido. base: "dashboard" (nutricionista) o "portal" (paciente)
export function clasesDeMarca(marca, base) {
  const clases = [];
  if (estiloDeMarca(marca)) clases.push(`${base}-marca`);
  if (marca?.tipografia && marca.tipografia !== "moderna") clases.push(`marca-fuente-${marca.tipografia}`);
  if (marca?.bordes && marca.bordes !== "suaves") clases.push(`marca-bordes-${marca.bordes}`);
  if (marca?.fondo === "liso") clases.push("marca-fondo-liso");
  return clases.join(" ");
}

const HEX = /^#[0-9a-f]{6}$/i;

function mezclar(hex, con, proporcion) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(con.slice(1), 16);
  const canal = (x, y) => Math.round(x + (y - x) * proporcion);
  const r = canal(a >> 16, b >> 16);
  const g = canal((a >> 8) & 255, (b >> 8) & 255);
  const bl = canal(a & 255, b & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

export function esColorPropio(color) {
  return HEX.test(color || "");
}

export function colorDeMarca(marca) {
  const color = marca?.color;
  if (color && PALETA_MARCA[color]) return PALETA_MARCA[color];
  if (esColorPropio(color)) {
    return { nombre: "Color propio", principal: color, oscuro: mezclar(color, "#000000", 0.62), claro: mezclar(color, "#ffffff", 0.55) };
  }
  return null;
}

// Fondo del encabezado según el estilo elegido
export function fondoEncabezado(c, estilo) {
  if (estilo === "solido") return c.oscuro;
  if (estilo === "ondas") {
    const ondas = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='160' viewBox='0 0 600 160'><path d='M0 110 C150 60 300 160 600 90 V160 H0Z' fill='${c.claro}' fill-opacity='0.18'/><path d='M0 130 C200 90 380 170 600 120 V160 H0Z' fill='${c.claro}' fill-opacity='0.14'/></svg>`,
    );
    return `url("data:image/svg+xml,${ondas}") bottom / 100% auto no-repeat, linear-gradient(110deg, ${c.oscuro}, ${c.principal})`;
  }
  return `radial-gradient(circle at 80% 15%, ${c.claro}40, transparent 40%), linear-gradient(110deg, ${c.oscuro}, ${c.principal})`;
}

// Variables CSS que repintan la app del paciente con el diseño elegido
export function estiloDeMarca(marca) {
  const c = colorDeMarca(marca);
  const estilo = marca?.estiloEncabezado;
  // Verde sin estilo especial = diseño original de NutriApp (con sus degradados propios)
  if (!c || (marca.color === "verde" && (!estilo || estilo === "degradado"))) return undefined;
  return {
    "--marca-principal": c.principal,
    "--marca-oscuro": c.oscuro,
    "--marca-claro": c.claro,
    "--marca-encabezado": fondoEncabezado(c, estilo),
    "--color-nutri-brand": c.principal,
    "--color-nutri-brand-dark": c.oscuro,
    "--color-nutri-ink": c.oscuro,
    "--color-nutri-mint": c.claro,
  };
}

const LADO_LOGO = 160;

// Achica el logo en el navegador (máx. 160 px) para guardarlo liviano
export function achicarLogo(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo || !/^image\/(png|jpeg|webp)$/.test(archivo.type)) {
      reject(new Error("Elige una imagen PNG, JPG o WebP"));
      return;
    }
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, LADO_LOGO / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let datos = canvas.toDataURL("image/webp", 0.85);
      if (!datos.startsWith("data:image/webp")) datos = canvas.toDataURL("image/png");
      if (datos.length > 85000) datos = canvas.toDataURL("image/jpeg", 0.8);
      resolve(datos);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

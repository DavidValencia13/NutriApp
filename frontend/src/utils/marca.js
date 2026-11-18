// Paleta de "Personalizar diseño". Las claves deben coincidir con
// COLORES_MARCA del backend (Nutriologo/Aplicacion/PersonalizarMarca.js).
// principal: botones y acentos · oscuro: menú lateral y encabezado
export const PALETA_MARCA = {
  verde: { nombre: "Verde NutriApp", principal: "#1F7A52", oscuro: "#0F3D33", claro: "#7BE0B0" },
  azul: { nombre: "Azul", principal: "#1D5FA8", oscuro: "#0F2747", claro: "#93C5FD" },
  turquesa: { nombre: "Turquesa", principal: "#0E7C80", oscuro: "#0B3033", claro: "#7FE3E0" },
  morado: { nombre: "Morado", principal: "#6D3FB0", oscuro: "#2A1748", claro: "#C4B5FD" },
  rosa: { nombre: "Rosa", principal: "#B83A72", oscuro: "#3D1428", claro: "#F9A8D4" },
  naranja: { nombre: "Naranja", principal: "#C2570C", oscuro: "#3E1D08", claro: "#FDBA74" },
  gris: { nombre: "Gris elegante", principal: "#475569", oscuro: "#1E293B", claro: "#CBD5E1" },
};

export function colorDeMarca(marca) {
  return marca?.color && PALETA_MARCA[marca.color] ? PALETA_MARCA[marca.color] : null;
}

// Variables CSS que repintan la app del paciente con el color elegido
export function estiloDeMarca(marca) {
  const c = colorDeMarca(marca);
  // Verde = diseño original de NutriApp (con sus degradados propios)
  if (!c || marca.color === "verde") return undefined;
  return {
    "--marca-principal": c.principal,
    "--marca-oscuro": c.oscuro,
    "--marca-claro": c.claro,
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

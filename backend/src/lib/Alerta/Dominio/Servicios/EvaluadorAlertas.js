// La feature de Alertas nutricionales (que vivía en este contexto) se quitó
// por ser redundante con Sugerencia: Sugerencia ya avisa de los mismos
// déficits/excesos pero además propone alimentos concretos del catálogo, sin
// exigir un flujo de resolución aparte ni bloquear "Aprobar menú". Estas
// funciones puras se conservan porque las siguen usando otros contextos
// (Efectividad, Alimento/CoberturaCatalogo, Sugerencia) — no son "de Alerta",
// son utilidades genéricas de dominio que quedaron viviendo aquí.

function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function slug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ajusteObjetivo(objetivo) {
  const texto = normalizar(objetivo);
  if (texto.includes("bajar") || texto.includes("perder") || texto.includes("reducir") || texto.includes("adelgazar"))
    return -500;
  if (texto.includes("subir") || texto.includes("aumentar") || texto.includes("ganar") || texto.includes("engordar"))
    return 500;
  return 0;
}

module.exports = { normalizar, slug, ajusteObjetivo };

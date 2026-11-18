// "Personalizar diseño": el nutricionista pone el nombre de su consulta, un
// color de la paleta y su logo; el paciente los ve en su app.
// marca = { nombreConsulta, color, logo } (cualquiera puede ser null)
const COLORES_MARCA = ["verde", "azul", "turquesa", "morado", "rosa", "naranja", "gris"];
const MAX_NOMBRE = 60;
// El logo llega ya achicado desde el navegador (≈160 px). Tope holgado y por
// debajo del límite de 100 kB del body JSON.
const MAX_LOGO = 90000;
const LOGO_VALIDO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.statusCode = 400;
  return error;
}

function normalizarMarca(datos = {}) {
  const nombreConsulta = String(datos.nombreConsulta ?? "").replace(/\s+/g, " ").trim() || null;
  if (nombreConsulta && nombreConsulta.length > MAX_NOMBRE)
    throw errorValidacion(`El nombre de la consulta admite como máximo ${MAX_NOMBRE} caracteres`);

  const color = datos.color ? String(datos.color) : null;
  if (color && !COLORES_MARCA.includes(color)) throw errorValidacion("Elige un color de la paleta");

  const logo = datos.logo ? String(datos.logo) : null;
  if (logo && !LOGO_VALIDO.test(logo)) throw errorValidacion("El logo debe ser una imagen PNG, JPG o WebP");
  if (logo && logo.length > MAX_LOGO) throw errorValidacion("El logo es muy pesado; usa una imagen más pequeña");

  return { nombreConsulta, color, logo };
}

function marcaVacia(marca) {
  return !marca || (!marca.nombreConsulta && !marca.color && !marca.logo);
}

class PersonalizarMarca {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async obtener(idNutriologo) {
    const nutriologo = await this.nutriologoRepository.findById(idNutriologo);
    if (!nutriologo) throw Object.assign(new Error("Nutricionista no encontrado"), { statusCode: 404 });
    return nutriologo.marca || { nombreConsulta: null, color: null, logo: null };
  }

  async guardar(idNutriologo, datos) {
    const marca = normalizarMarca(datos);
    const nutriologo = await this.nutriologoRepository.updateById(idNutriologo, { marca: marcaVacia(marca) ? null : marca });
    if (!nutriologo) throw Object.assign(new Error("Nutricionista no encontrado"), { statusCode: 404 });
    return nutriologo.marca || { nombreConsulta: null, color: null, logo: null };
  }
}

module.exports = { PersonalizarMarca, normalizarMarca, COLORES_MARCA };

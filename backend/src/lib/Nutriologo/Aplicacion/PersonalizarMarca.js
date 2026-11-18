// "Personalizar diseño": el nutricionista define cómo ve su paciente la app.
// marca = { nombreConsulta, especialidad, mensajeBienvenida, color,
//           estiloEncabezado, tipografia, bordes, fondo, logo }
//   (cualquiera puede ser null = diseño original de NutriApp)
//   color: una clave de la paleta o un color propio "#rrggbb"
const COLORES_MARCA = ["verde", "azul", "turquesa", "morado", "rosa", "naranja", "gris"];
const ESTILOS_ENCABEZADO = ["degradado", "solido", "ondas"];
// Opciones de diseño general (valor permitido -> se valida contra la lista)
const OPCIONES = {
  tipografia: ["moderna", "clasica", "redondeada"],
  bordes: ["suaves", "rectos", "redondeados"],
  fondo: ["decorado", "liso"],
};
const COLOR_PROPIO = /^#[0-9a-f]{6}$/i;
const LIMITES = { nombreConsulta: 60, especialidad: 80, mensajeBienvenida: 160 };
// El logo llega ya achicado desde el navegador (≈160 px). Tope holgado y por
// debajo del límite de 100 kB del body JSON.
const MAX_LOGO = 90000;
const LOGO_VALIDO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.statusCode = 400;
  return error;
}

function texto(datos, campo, etiqueta) {
  const valor = String(datos[campo] ?? "").replace(/\s+/g, " ").trim() || null;
  if (valor && valor.length > LIMITES[campo])
    throw errorValidacion(`${etiqueta} admite como máximo ${LIMITES[campo]} caracteres`);
  return valor;
}

function normalizarMarca(datos = {}) {
  const nombreConsulta = texto(datos, "nombreConsulta", "El nombre de la consulta");
  const especialidad = texto(datos, "especialidad", "La especialidad");
  const mensajeBienvenida = texto(datos, "mensajeBienvenida", "El mensaje de bienvenida");

  const color = datos.color ? String(datos.color).toLowerCase() : null;
  if (color && !COLORES_MARCA.includes(color) && !COLOR_PROPIO.test(color))
    throw errorValidacion("Elige un color de la paleta o un color válido");

  const estiloEncabezado = datos.estiloEncabezado ? String(datos.estiloEncabezado) : null;
  if (estiloEncabezado && !ESTILOS_ENCABEZADO.includes(estiloEncabezado))
    throw errorValidacion("Estilo de encabezado no válido");

  const opciones = {};
  for (const [campo, permitidos] of Object.entries(OPCIONES)) {
    const valor = datos[campo] ? String(datos[campo]) : null;
    if (valor && !permitidos.includes(valor)) throw errorValidacion("Opción de diseño no válida");
    opciones[campo] = valor;
  }

  const logo = datos.logo ? String(datos.logo) : null;
  if (logo && !LOGO_VALIDO.test(logo)) throw errorValidacion("El logo debe ser una imagen PNG, JPG o WebP");
  if (logo && logo.length > MAX_LOGO) throw errorValidacion("El logo es muy pesado; usa una imagen más pequeña");

  return { nombreConsulta, especialidad, mensajeBienvenida, color, estiloEncabezado, ...opciones, logo };
}

const VACIA = {
  nombreConsulta: null, especialidad: null, mensajeBienvenida: null, color: null,
  estiloEncabezado: null, tipografia: null, bordes: null, fondo: null, logo: null,
};

function marcaVacia(marca) {
  return !marca || Object.values(marca).every((v) => !v);
}

class PersonalizarMarca {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async obtener(idNutriologo) {
    const nutriologo = await this.nutriologoRepository.findById(idNutriologo);
    if (!nutriologo) throw Object.assign(new Error("Nutricionista no encontrado"), { statusCode: 404 });
    return { ...VACIA, ...(nutriologo.marca || {}) };
  }

  async guardar(idNutriologo, datos) {
    const marca = normalizarMarca(datos);
    const nutriologo = await this.nutriologoRepository.updateById(idNutriologo, { marca: marcaVacia(marca) ? null : marca });
    if (!nutriologo) throw Object.assign(new Error("Nutricionista no encontrado"), { statusCode: 404 });
    return { ...VACIA, ...(nutriologo.marca || {}) };
  }
}

module.exports = { PersonalizarMarca, normalizarMarca, COLORES_MARCA, ESTILOS_ENCABEZADO, OPCIONES };

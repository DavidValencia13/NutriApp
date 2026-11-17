function validarNumero(numero) {
  if (typeof numero !== "string") {
    const error = new Error("Ingresa un número de WhatsApp válido");
    error.statusCode = 400;
    throw error;
  }
  const limpio = numero.trim().replace(/[\s()-]/g, "");
  if (!limpio) return null;
  const digitos = limpio.startsWith("+") ? limpio.slice(1) : limpio;
  if (/^09\d{8}$/.test(digitos)) return `593${digitos.slice(1)}`;
  if (/^[1-9]\d{7,14}$/.test(digitos)) return digitos;
  const error = new Error("Usa un número ecuatoriano 09… o un número completo con código de país");
  error.statusCode = 400;
  throw error;
}

class ActualizarWhatsappNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar(idNutriologo, numero) {
    const whatsappNumero = validarNumero(numero);
    const nutriologo = await this.nutriologoRepository.updateById(idNutriologo, { whatsappNumero });
    if (!nutriologo) {
      const error = new Error("Nutricionista no encontrado");
      error.statusCode = 404;
      throw error;
    }
    return { numero: nutriologo.whatsappNumero };
  }
}

module.exports = { ActualizarWhatsappNutriologo, validarNumero };

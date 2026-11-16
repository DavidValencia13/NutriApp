const Nutriologo = require("../Dominio/Entidades/Nutriologo");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Compara sin revelar por el tiempo de respuesta cuántos caracteres acertó
function mismoCodigo(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Caso de uso: registrar un nuevo nutriólogo.
// Si hay código de invitación configurado (CODIGO_INVITACION en la página
// publicada), solo se puede crear cuenta con ese código: así un desconocido
// que encuentre el link no puede registrarse y gastar los créditos de IA.
class RegistrarNutriologo {
  constructor(nutriologoRepository, { codigoInvitacion } = {}) {
    this.nutriologoRepository = nutriologoRepository;
    this.codigoInvitacion = codigoInvitacion || null;
  }

  async ejecutar(data) {
    if (this.codigoInvitacion && !mismoCodigo(String(data?.codigoInvitacion || "").trim(), this.codigoInvitacion)) {
      throw new Error("El código de invitación no es válido");
    }

    // Valida con la contraseña en texto plano: después de encriptarla el hash
    // siempre mide 60 caracteres y la regla de longitud mínima no tendría efecto
    const validado = new Nutriologo(data);

    // Verifica que el email no esté registrado (la entidad ya lo normalizó a minúsculas)
    const existe = await this.nutriologoRepository.findByEmail(validado.email);
    if (existe) throw new Error("El email ya está registrado");

    // Encripta la contraseña antes de guardar
    const passwordHash = await bcrypt.hash(validado.password, 10);

    const nutriologo = new Nutriologo({
      ...validado,
      password: passwordHash,
    });

    return await this.nutriologoRepository.save(nutriologo);
  }
}

module.exports = RegistrarNutriologo;

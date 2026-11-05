const Nutriologo = require("../Dominio/Entidades/Nutriologo");
const bcrypt = require("bcryptjs");

// Caso de uso: registrar un nuevo nutriólogo
class RegistrarNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar(data) {
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

const Nutriologo = require("../Dominio/Entidades/Nutriologo");
const bcrypt = require("bcryptjs");

// Caso de uso: registrar un nuevo nutriólogo
class RegistrarNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar(data) {
    // Verifica que el email no esté registrado
    const existe = await this.nutriologoRepository.findByEmail(data.email);
    if (existe) throw new Error("El email ya está registrado");

    // Encripta la contraseña antes de guardar
    const passwordHash = await bcrypt.hash(data.password, 10);

    const nutriologo = new Nutriologo({
      ...data,
      password: passwordHash,
    });

    return await this.nutriologoRepository.save(nutriologo);
  }
}

module.exports = RegistrarNutriologo;

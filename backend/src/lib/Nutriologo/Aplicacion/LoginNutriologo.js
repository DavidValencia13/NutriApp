const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Caso de uso: iniciar sesión
class LoginNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar({ email, password }) {
    // Busca el nutriólogo por email
    const nutriologo = await this.nutriologoRepository.findByEmail(email);
    if (!nutriologo) throw new Error("Email invalido");

    // Verifica la contraseña
    const passwordValida = await bcrypt.compare(password, nutriologo.password);
    if (!passwordValida) throw new Error("Contraseña incorrecta");

    // Genera el token JWT. Pase de acceso temporal para el nutriólogo
    // Dura 6 horas y contiene su id y email
    const token = jwt.sign(
      { id: nutriologo.id, email: nutriologo.email },
      process.env.JWT_SECRET || "nutriapp_secret_key",
      { expiresIn: "6h" },
    );

    return {
      token,
      nutriologo: {
        id: nutriologo.id,
        nombre: nutriologo.nombre,
        apellido: nutriologo.apellido,
        email: nutriologo.email,
      },
    };
  }
}

module.exports = LoginNutriologo;

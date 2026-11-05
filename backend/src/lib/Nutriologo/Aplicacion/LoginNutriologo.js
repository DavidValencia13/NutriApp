const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { obtenerJwtSecret } = require("../../../Infraestructura/jwtSecret");

// Mismo mensaje para email inexistente y contraseña errónea: así no se
// revela qué correos están registrados
const CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos";

// Caso de uso: iniciar sesión
class LoginNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar({ email, password }) {
    // Busca el nutriólogo por email
    if (!email || !password) throw new Error(CREDENCIALES_INVALIDAS);

    const nutriologo = await this.nutriologoRepository.findByEmail(
      String(email).toLowerCase().trim(),
    );
    if (!nutriologo) throw new Error(CREDENCIALES_INVALIDAS);

    // Verifica la contraseña
    const passwordValida = await bcrypt.compare(password, nutriologo.password);
    if (!passwordValida) throw new Error(CREDENCIALES_INVALIDAS);

    // Genera el token JWT. Pase de acceso temporal para el nutriólogo
    // Dura 6 horas y contiene su id y email
    const token = jwt.sign(
      { id: nutriologo.id, email: nutriologo.email },
      obtenerJwtSecret(),
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

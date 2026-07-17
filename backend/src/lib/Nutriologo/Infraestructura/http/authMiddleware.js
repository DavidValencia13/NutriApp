// Para generar la clave o token que el servidor le entrega al usuario después de hacer login exitosamente
const jwt = require("jsonwebtoken");

// Middleware (función que se ejecuta ANTES del controller, para revisar/preparar la petición)
// Valida el token JWT (el "pase de acceso" que se genera en el login)
function authMiddleware(req, res, next) {
  // Authorization header (parte de la petición HTTP donde normalmente viaja el token)
  const authHeader = req.headers.authorization;

  // El formato estándar es "Bearer <token>", por eso revisamos que empiece así
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  // Separamos la palabra "Bearer" del token real
  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify revisa que el token sea válido y no haya expirado (recuerda: dura 6h)
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "nutriapp_secret_key",
    );
    // Guardamos los datos del nutriólogo logueado en req.nutriologo
    // (así el controller que sigue puede usarlos, ej: saber de quién son los pacientes)
    req.nutriologo = payload;
    next(); // next() = "Essta todo bien, se sigue al controller"
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
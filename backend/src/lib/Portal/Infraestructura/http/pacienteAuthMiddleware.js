const jwt = require("jsonwebtoken");
const { obtenerJwtSecret } = require("../../../../Infraestructura/jwtSecret");

// Valida la sesión del PACIENTE (token con rol "paciente"). El id del
// paciente sale del token, nunca de la URL: así un paciente no puede pedir
// los datos de otro cambiando un número.
function pacienteAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }
  try {
    const payload = jwt.verify(authHeader.split(" ")[1], obtenerJwtSecret());
    if (payload.rol !== "paciente" || !Number.isInteger(payload.idPaciente)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    req.idPaciente = payload.idPaciente;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

module.exports = pacienteAuthMiddleware;

// Clave para firmar y verificar los tokens JWT.
// No hay valor por defecto: una clave conocida permitiría a cualquiera
// fabricar tokens válidos. server.js valida que exista antes de arrancar.
function obtenerJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado en el .env");
  return secret;
}

module.exports = { obtenerJwtSecret };

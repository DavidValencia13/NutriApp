// Errores de dominio con código HTTP asociado
// (para que el controller pueda mapear 400/404 sin adivinar por el mensaje)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

// Para fallas de servicios externos (ej. USDA FoodData Central caído o sin
// responder): nunca debe bloquear el registro manual, solo se usa para que
// el controller le avise al frontend que la búsqueda automática falló.
class ServicioExternoError extends AppError {
  constructor(message, statusCode = 502) {
    super(message, statusCode);
  }
}

module.exports = { AppError, ValidationError, NotFoundError, ServicioExternoError };

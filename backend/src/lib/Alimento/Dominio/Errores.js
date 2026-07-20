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

module.exports = { AppError, ValidationError, NotFoundError };

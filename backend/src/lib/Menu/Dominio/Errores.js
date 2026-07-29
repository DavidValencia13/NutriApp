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

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class ServicioExternoError extends AppError {
  constructor(message, statusCode = 502) {
    super(message, statusCode);
  }
}

// Se usa cuando AprobarMenu detecta alertas críticas pendientes: no es un
// dato inválido del request (400) ni un conflicto de concurrencia (409),
// es que el propio contenido del menú no pasa la validación nutricional.
// 422 = Unprocessable Entity. Trae `alertas` para que el frontend muestre
// el detalle sin tener que volver a consultarlas.
class AlertasCriticasError extends AppError {
  constructor(alertas) {
    super("El menú tiene alertas críticas sin resolver", 422);
    this.alertas = alertas;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServicioExternoError,
  AlertasCriticasError,
};

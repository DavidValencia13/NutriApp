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

module.exports = { AppError, ValidationError, NotFoundError, ConflictError, ServicioExternoError };

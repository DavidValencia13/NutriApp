class ServicioExternoError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { ServicioExternoError };

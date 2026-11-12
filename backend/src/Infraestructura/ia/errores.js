// Errores comunes a todos los proveedores de IA (Groq, Anthropic). Cada
// cliente lanza sus propias subclases, pero quien consume la IA (generador de
// menús, traducción de alimentos) solo necesita conocer estas.
class IATimeoutError extends Error {}
class IARequestError extends Error {}
class IARateLimitError extends Error {
  constructor(message, retryAfterSeconds) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

module.exports = { IATimeoutError, IARequestError, IARateLimitError };

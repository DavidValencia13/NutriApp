// Entidad principal del dominio Nutriólogo
// Contiene las validaciones de negocio
class Nutriologo {
  constructor({ id, nombre, apellido, email, password }) {
    // Validaciones
    if (!nombre || nombre.trim().length === 0)
      throw new Error("El nombre es requerido");

    if (!apellido || apellido.trim().length === 0)
      throw new Error("El apellido es requerido");

    if (!email || !email.includes("@"))
      throw new Error("El email no es válido");

    if (!password || password.length < 6)
      throw new Error("La contraseña debe tener mínimo 6 caracteres");

    // Asignar valores
    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.email = email.toLowerCase().trim();
    this.password = password;
  }
}

module.exports = Nutriologo;

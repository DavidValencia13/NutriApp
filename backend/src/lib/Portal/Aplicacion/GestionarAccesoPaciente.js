const bcrypt = require("bcryptjs");
const AccesoPaciente = require("../Dominio/Entidades/AccesoPaciente");
const { ConflictError, NotFoundError, ValidationError } = require("../Dominio/Errores");

// Casos de uso del nutriólogo sobre el acceso de su paciente a la app:
// verlo, crearlo o cambiarlo (correo y contraseña que él mismo define) y
// quitarlo. El dueño del paciente ya lo verificó el middleware de la ruta.
class GestionarAccesoPaciente {
  constructor(accesoRepository) {
    this.accesoRepository = accesoRepository;
  }

  async obtener(idPaciente) {
    const acceso = await this.accesoRepository.findByPaciente(idPaciente);
    return acceso ? { tieneAcceso: true, email: acceso.email } : { tieneAcceso: false, email: null };
  }

  // Al crear el acceso la contraseña es obligatoria; al editarlo, si viene
  // vacía se conserva la anterior (para cambiar solo el correo)
  async guardar(idPaciente, { email, password }) {
    const existente = await this.accesoRepository.findByPaciente(idPaciente);
    const acceso = new AccesoPaciente({ idPaciente, email });

    const otro = await this.accesoRepository.findByEmail(acceso.email);
    if (otro && otro.idPaciente !== acceso.idPaciente)
      throw new ConflictError("Ese correo ya lo usa otro paciente");

    let passwordHash = existente?.password;
    if (password) {
      AccesoPaciente.validarPassword(password);
      passwordHash = await bcrypt.hash(String(password), 10);
    }
    if (!passwordHash) throw new ValidationError("La contraseña es obligatoria para crear el acceso");

    const guardado = await this.accesoRepository.guardar({ idPaciente: acceso.idPaciente, email: acceso.email, password: passwordHash });
    return { tieneAcceso: true, email: guardado.email };
  }

  async eliminar(idPaciente) {
    const eliminado = await this.accesoRepository.eliminarPorPaciente(idPaciente);
    if (!eliminado) throw new NotFoundError("Este paciente no tiene acceso a la app");
  }
}

module.exports = GestionarAccesoPaciente;

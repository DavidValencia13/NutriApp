const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { obtenerJwtSecret } = require("../../../Infraestructura/jwtSecret");
const { CredencialesError } = require("../Dominio/Errores");

// Caso de uso: el paciente inicia sesión con el correo y la contraseña que le
// creó su nutriólogo. El token lleva rol "paciente": solo sirve en /api/portal.
class LoginPaciente {
  constructor({ accesoRepository, pacienteRepository }) {
    this.accesoRepository = accesoRepository;
    this.pacienteRepository = pacienteRepository;
  }

  async ejecutar({ email, password }) {
    if (!email || !password) throw new CredencialesError();

    const acceso = await this.accesoRepository.findByEmail(String(email).toLowerCase().trim());
    if (!acceso) throw new CredencialesError();

    const valida = await bcrypt.compare(String(password), acceso.password);
    if (!valida) throw new CredencialesError();

    const paciente = await this.pacienteRepository.findById(acceso.idPaciente);
    if (!paciente) throw new CredencialesError();

    const token = jwt.sign({ idPaciente: paciente.id, rol: "paciente" }, obtenerJwtSecret(), { expiresIn: "12h" });
    return { token, paciente: { id: paciente.id, nombre: paciente.nombre, email: acceso.email } };
  }
}

module.exports = LoginPaciente;

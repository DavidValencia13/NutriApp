const { ValidationError } = require("../Errores");

const NIVELES_VALIDOS = ["informativa", "advertencia", "critica"];
const ESTADOS_VALIDOS = ["pendiente", "aceptada", "corregida", "ignorada"];

class Alerta {
  constructor({
    id,
    idPaciente,
    idMenu,
    nivel,
    tipo,
    mensaje,
    estado,
    observacion,
    fechaGeneracion,
    fechaResolucion,
  }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    const idMenuNum = Number(idMenu);
    if (!Number.isInteger(idMenuNum) || idMenuNum <= 0)
      throw new ValidationError("El id del menú no es válido");

    if (!NIVELES_VALIDOS.includes(nivel))
      throw new ValidationError(`nivel debe ser uno de: ${NIVELES_VALIDOS.join(", ")}`);

    if (!tipo || tipo.trim().length === 0)
      throw new ValidationError("El tipo de alerta es requerido");

    if (!mensaje || mensaje.trim().length === 0)
      throw new ValidationError("El mensaje de la alerta es requerido");

    const estadoFinal = estado || "pendiente";
    if (!ESTADOS_VALIDOS.includes(estadoFinal))
      throw new ValidationError(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.idMenu = idMenuNum;
    this.nivel = nivel;
    this.tipo = tipo.trim();
    this.mensaje = mensaje.trim();
    this.estado = estadoFinal;
    this.observacion = observacion || undefined;
    this.fechaGeneracion = fechaGeneracion || new Date();
    this.fechaResolucion = fechaResolucion || undefined;
  }
}

module.exports = Alerta;
module.exports.NIVELES_VALIDOS = NIVELES_VALIDOS;
module.exports.ESTADOS_VALIDOS = ESTADOS_VALIDOS;

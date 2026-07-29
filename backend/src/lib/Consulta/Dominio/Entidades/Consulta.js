const { ValidationError } = require("../Errores");

// Medidas corporales soportadas (circunferencias en cm), todas opcionales.
const CAMPOS_MEDIDAS = ["cintura", "cadera", "brazo", "muslo", "pecho", "cuello"];

// Entidad principal del dominio Consulta: un registro puntual en el tiempo
// del estado físico del paciente (peso, composición corporal, medidas) más
// las notas del nutriólogo. Es la unidad básica del historial/evolución —
// varias Consultas ordenadas por fecha permiten graficar la evolución.
class Consulta {
  constructor({
    id,
    idPaciente,
    fecha,
    peso,
    porcentajeGrasaCorporal,
    masaMuscular,
    medidas,
    observaciones,
    resultados,
  }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    // peso es el único dato obligatorio: es el mínimo necesario para poder
    // graficar evolución. El resto se captura cuando el consultorio tenga
    // el equipo (báscula de bioimpedancia, cinta métrica, etc.).
    if (!Number.isFinite(peso) || peso <= 0)
      throw new ValidationError("El peso debe ser mayor a 0");

    if (
      porcentajeGrasaCorporal !== undefined &&
      porcentajeGrasaCorporal !== null &&
      (!Number.isFinite(porcentajeGrasaCorporal) || porcentajeGrasaCorporal < 0 || porcentajeGrasaCorporal > 100)
    )
      throw new ValidationError("El porcentaje de grasa corporal debe estar entre 0 y 100");

    if (
      masaMuscular !== undefined &&
      masaMuscular !== null &&
      (!Number.isFinite(masaMuscular) || masaMuscular < 0)
    )
      throw new ValidationError("La masa muscular no puede ser negativa");

    let medidasValidadas;
    if (medidas !== undefined && medidas !== null) {
      medidasValidadas = {};
      for (const campo of CAMPOS_MEDIDAS) {
        const valor = medidas[campo];
        if (valor === undefined || valor === null) continue;
        if (!Number.isFinite(valor) || valor < 0)
          throw new ValidationError(`La medida de ${campo} debe ser un número mayor o igual a 0`);
        medidasValidadas[campo] = valor;
      }
    }

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.fecha = fecha || new Date();
    this.peso = peso;
    this.porcentajeGrasaCorporal = porcentajeGrasaCorporal ?? undefined;
    this.masaMuscular = masaMuscular ?? undefined;
    this.medidas = medidasValidadas;
    this.observaciones = observaciones ? observaciones.trim() : undefined;
    this.resultados = resultados ? resultados.trim() : undefined;
  }
}

module.exports = Consulta;
module.exports.CAMPOS_MEDIDAS = CAMPOS_MEDIDAS;

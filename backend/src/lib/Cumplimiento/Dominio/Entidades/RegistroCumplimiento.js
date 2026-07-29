const { ValidationError } = require("../Errores");

const NIVEL_MIN = 1;
const NIVEL_MAX = 5;

function validarListaIds(valor, campo) {
  if (valor === undefined || valor === null) return [];
  if (!Array.isArray(valor)) throw new ValidationError(`${campo} debe ser una lista`);
  return valor.map((v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) throw new ValidationError(`${campo} contiene un id inválido`);
    return n;
  });
}

function validarListaTexto(valor, campo) {
  if (valor === undefined || valor === null) return [];
  if (!Array.isArray(valor)) throw new ValidationError(`${campo} debe ser una lista`);
  return valor.map((v) => (v ?? "").toString().trim()).filter((v) => v.length > 0);
}

function validarNivel(valor, campo) {
  if (valor === undefined || valor === null) return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < NIVEL_MIN || n > NIVEL_MAX)
    throw new ValidationError(`${campo} debe ser un número entero entre ${NIVEL_MIN} y ${NIVEL_MAX}`);
  return n;
}

// Registro de cumplimiento: lo captura el nutriólogo en consulta (el
// paciente no tiene cuenta propia en la app hoy) para un día puntual de un
// menú ya asignado. Es la unidad básica del seguimiento del tratamiento —
// varios registros permiten calcular el % de cumplimiento y armar un
// resumen (ver ResumenCumplimiento.js).
class RegistroCumplimiento {
  constructor({
    id,
    idPaciente,
    idMenu,
    idDiaMenu,
    fecha,
    comidasConsumidas,
    comidasOmitidas,
    cambiosRealizados,
    cantidadAgua,
    peso,
    nivelHambre,
    nivelEnergia,
    actividadFisica,
    sintomas,
    observaciones,
  }) {
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    const idMenuNum = Number(idMenu);
    if (!Number.isInteger(idMenuNum) || idMenuNum <= 0)
      throw new ValidationError("El id del menú no es válido");

    const idDiaMenuNum = Number(idDiaMenu);
    if (!Number.isInteger(idDiaMenuNum) || idDiaMenuNum <= 0)
      throw new ValidationError("El id del día del menú no es válido");

    const consumidas = validarListaIds(comidasConsumidas, "comidasConsumidas");
    const omitidas = validarListaIds(comidasOmitidas, "comidasOmitidas");
    if (consumidas.some((id) => omitidas.includes(id)))
      throw new ValidationError("Una comida no puede estar consumida y omitida a la vez");

    if (
      cantidadAgua !== undefined &&
      cantidadAgua !== null &&
      (!Number.isFinite(cantidadAgua) || cantidadAgua < 0)
    )
      throw new ValidationError("La cantidad de agua debe ser un número mayor o igual a 0");

    if (peso !== undefined && peso !== null && (!Number.isFinite(peso) || peso <= 0))
      throw new ValidationError("El peso debe ser mayor a 0");

    this.id = id;
    this.idPaciente = idPacienteNum;
    this.idMenu = idMenuNum;
    this.idDiaMenu = idDiaMenuNum;
    this.fecha = fecha || new Date();
    this.comidasConsumidas = consumidas;
    this.comidasOmitidas = omitidas;
    this.cambiosRealizados = cambiosRealizados ? cambiosRealizados.trim() : undefined;
    this.cantidadAgua = cantidadAgua ?? undefined;
    this.peso = peso ?? undefined;
    this.nivelHambre = validarNivel(nivelHambre, "nivelHambre");
    this.nivelEnergia = validarNivel(nivelEnergia, "nivelEnergia");
    this.actividadFisica = actividadFisica ? actividadFisica.trim() : undefined;
    this.sintomas = validarListaTexto(sintomas, "sintomas");
    this.observaciones = observaciones ? observaciones.trim() : undefined;
  }
}

module.exports = RegistroCumplimiento;
module.exports.NIVEL_MIN = NIVEL_MIN;
module.exports.NIVEL_MAX = NIVEL_MAX;

const { ValidationError } = require("../Errores");

// Entidad principal del dominio Alimento
// (entidad = clase que representa un objeto real del negocio, con sus reglas de validación)
class Alimento {
  constructor({ id, idPaciente, nombre, cantidad, unidadMedida, precio }) {
    // idPaciente debe ser un entero positivo. Ojo: no usar solo "!idPaciente",
    // porque NaN e Infinity son casos que un chequeo ingenuo deja pasar.
    const idPacienteNum = Number(idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0)
      throw new ValidationError("El id del paciente no es válido");

    if (!nombre || nombre.trim().length === 0)
      throw new ValidationError("El nombre es requerido");

    if (!Number.isFinite(cantidad) || cantidad <= 0)
      throw new ValidationError("La cantidad debe ser mayor a 0");

    if (!unidadMedida || unidadMedida.trim().length === 0)
      throw new ValidationError("La unidad de medida es requerida");

    // precio: costo por unidad de medida (ej. precio por kg). Por defecto 0
    // para no romper alimentos registrados antes de que este campo existiera.
    const precioNum = precio === undefined || precio === null ? 0 : precio;
    if (!Number.isFinite(precioNum) || precioNum < 0)
      throw new ValidationError("El precio no puede ser negativo");

    // Asignar valores
    this.id = id;
    this.idPaciente = idPacienteNum;
    this.nombre = nombre.trim();
    this.cantidad = cantidad;
    this.unidadMedida = unidadMedida.trim();
    this.precio = precioNum;
  }
}

module.exports = Alimento;

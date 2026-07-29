const { ValidationError } = require("../Errores");
const { GRUPOS_ALIMENTICIOS } = require("./GruposAlimenticios");

// Campos nutricionales soportados, todos opcionales (RF: se puede guardar
// un alimento con información incompleta; las alertas por datos faltantes
// se resuelven en una fase posterior).
const CAMPOS_NUTRIENTES = [
  "calorias",
  "proteinas",
  "carbohidratos",
  "grasasTotales",
  "grasasSaturadas",
  "fibra",
  "azucares",
  "sodio",
  "potasio",
  "calcio",
  "hierro",
  "magnesio",
  "vitaminaA",
  "vitaminaC",
  "vitaminaD",
  "vitaminaB12",
];

// Entidad principal del dominio Alimento
// (entidad = clase que representa un objeto real del negocio, con sus reglas de validación)
class Alimento {
  constructor({
    id,
    idPaciente,
    nombre,
    cantidad,
    unidadMedida,
    precio,
    gruposAlimenticios,
    infoNutricional,
  }) {
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

    // gruposAlimenticios: clasificación obligatoria (al menos 1), habilita
    // las fases futuras de sugerencias/alertas por grupo alimenticio.
    if (!Array.isArray(gruposAlimenticios) || gruposAlimenticios.length === 0)
      throw new ValidationError(
        "El alimento debe tener al menos un grupo alimenticio",
      );
    const gruposInvalidos = gruposAlimenticios.filter(
      (g) => !GRUPOS_ALIMENTICIOS.includes(g),
    );
    if (gruposInvalidos.length > 0)
      throw new ValidationError(
        `Grupo(s) alimenticio(s) no válido(s): ${gruposInvalidos.join(", ")}`,
      );

    // infoNutricional: opcional en su totalidad. Si viene, cada nutriente
    // presente debe ser numérico >= 0; refUnidad "porcion" exige
    // gramosPorPorcion para poder convertir a base 100g más adelante.
    let infoNutricionalValidada;
    if (infoNutricional !== undefined && infoNutricional !== null) {
      const {
        refCantidad = 100,
        refUnidad = "g",
        gramosPorPorcion,
        ...nutrientes
      } = infoNutricional;

      if (refUnidad !== "g" && refUnidad !== "porcion")
        throw new ValidationError(
          "refUnidad de infoNutricional debe ser 'g' o 'porcion'",
        );
      if (!Number.isFinite(refCantidad) || refCantidad <= 0)
        throw new ValidationError("refCantidad debe ser mayor a 0");
      if (
        refUnidad === "porcion" &&
        (!Number.isFinite(gramosPorPorcion) || gramosPorPorcion <= 0)
      )
        throw new ValidationError(
          "gramosPorPorcion es requerido cuando refUnidad es 'porcion'",
        );

      infoNutricionalValidada = { refCantidad, refUnidad };
      if (gramosPorPorcion !== undefined)
        infoNutricionalValidada.gramosPorPorcion = gramosPorPorcion;

      for (const campo of CAMPOS_NUTRIENTES) {
        const valor = nutrientes[campo];
        if (valor === undefined || valor === null) continue;
        if (!Number.isFinite(valor) || valor < 0)
          throw new ValidationError(
            `El valor de ${campo} debe ser un número mayor o igual a 0`,
          );
        infoNutricionalValidada[campo] = valor;
      }
    }

    // Asignar valores
    this.id = id;
    this.idPaciente = idPacienteNum;
    this.nombre = nombre.trim();
    this.cantidad = cantidad;
    this.unidadMedida = unidadMedida.trim();
    this.precio = precioNum;
    this.gruposAlimenticios = gruposAlimenticios;
    this.infoNutricional = infoNutricionalValidada;
  }
}

module.exports = Alimento;
module.exports.CAMPOS_NUTRIENTES = CAMPOS_NUTRIENTES;

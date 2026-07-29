const SEXOS_VALIDOS = ["masculino", "femenino", "otro"];

// Entidad principal del dominio Paciente
// (entidad = clase que representa un objeto real del negocio, con sus reglas de validación)
class Paciente {
  constructor({
    id,
    idNutriologo, // a qué nutriólogo pertenece este paciente
    nombre,
    peso,
    altura,
    objetivo,
    nivelActividad,
    numeroComidas,
    presupuesto,
    tiempoParaCocinar,
    restricciones,
    preferencias,
    alergias,
    enfermedades,
    pesoInicial,
    edad,
    sexo,
  }) {
    // Validaciones (reglas de negocio: qué datos son obligatorios y válidos)
    if (!idNutriologo)
      throw new Error("El paciente debe pertenecer a un nutriólogo");

    if (!nombre || nombre.trim().length === 0)
      throw new Error("El nombre es requerido");

    if (!peso || peso <= 0) throw new Error("El peso debe ser mayor a 0");

    if (!altura || altura <= 0) throw new Error("La altura debe ser mayor a 0");

    if (!objetivo || objetivo.trim().length === 0)
      throw new Error("El objetivo es requerido");

    if (!nivelActividad || nivelActividad.trim().length === 0)
      throw new Error("El nivel de actividad es requerido");

    if (!numeroComidas || numeroComidas <= 0)
      throw new Error("El número de comidas debe ser mayor a 0");

    if (presupuesto === undefined || presupuesto < 0)
      throw new Error("El presupuesto no puede ser negativo");

    if (!tiempoParaCocinar || tiempoParaCocinar < 0)
      throw new Error("El tiempo para cocinar no puede ser negativo");

    if (alergias !== undefined && !Array.isArray(alergias))
      throw new Error("Las alergias deben ser una lista");

    if (enfermedades !== undefined && !Array.isArray(enfermedades))
      throw new Error("Las enfermedades deben ser una lista");

    // pesoInicial se fija una sola vez: en el registro, si no viene, se toma
    // el peso actual. En ediciones posteriores, el caso de uso EditarPaciente
    // siempre reenvía el pesoInicial ya existente, así que nunca se
    // recalcula a partir de un peso más reciente.
    const pesoInicialNum =
      pesoInicial === undefined || pesoInicial === null ? peso : pesoInicial;
    if (!pesoInicialNum || pesoInicialNum <= 0)
      throw new Error("El peso inicial debe ser mayor a 0");

    // edad/sexo: opcionales. Habilitan un cálculo calórico personalizado
    // (Mifflin-St Jeor) en la evaluación de alertas; sin ellos, esa alerta
    // específica simplemente no se genera, el resto del sistema sigue igual.
    if (edad !== undefined && edad !== null && (!Number.isInteger(edad) || edad <= 0 || edad >= 130))
      throw new Error("La edad debe ser un entero entre 1 y 129");

    if (sexo !== undefined && sexo !== null && !SEXOS_VALIDOS.includes(sexo))
      throw new Error(`El sexo debe ser uno de: ${SEXOS_VALIDOS.join(", ")}`);

    // Asignar valores
    this.id = id;
    this.idNutriologo = idNutriologo;
    this.nombre = nombre.trim();
    this.peso = peso;
    this.altura = altura;
    this.objetivo = objetivo.trim();
    this.nivelActividad = nivelActividad.trim();
    this.numeroComidas = numeroComidas;
    this.presupuesto = presupuesto;
    this.tiempoParaCocinar = tiempoParaCocinar;
    this.restricciones = restricciones ? restricciones.trim() : "";
    this.preferencias = preferencias ? preferencias.trim() : "";
    this.alergias = alergias || [];
    this.enfermedades = enfermedades || [];
    this.pesoInicial = pesoInicialNum;
    this.edad = edad ?? undefined;
    this.sexo = sexo ?? undefined;
  }
}

module.exports = Paciente;
module.exports.SEXOS_VALIDOS = SEXOS_VALIDOS;
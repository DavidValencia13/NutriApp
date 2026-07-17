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
  }
}

module.exports = Paciente;
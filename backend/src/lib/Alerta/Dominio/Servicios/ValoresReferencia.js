// Valores diarios de referencia (Daily Values) usados por Sugerencia y por
// Alimento/CoberturaCatalogo para juzgar si un nutriente está cubierto. Son
// los estándar de la FDA para un adulto promedio, no personalizados por
// paciente. Quedan como constantes de código por ahora; hacerlos
// configurables por el nutriólogo es una mejora pendiente para una fase
// posterior (regla del pedido original: "los cálculos deben ser
// configurables según las reglas del profesional").
const VALORES_DIARIOS_REFERENCIA = {
  proteinas: 50, // g
  carbohidratos: 275, // g
  grasasSaturadas: 20, // g
  fibra: 28, // g
  sodio: 2300, // mg
  potasio: 4700, // mg
  calcio: 1300, // mg
  hierro: 18, // mg
  magnesio: 420, // mg
  vitaminaA: 900, // mcg
  vitaminaC: 90, // mg
  vitaminaD: 20, // mcg
  vitaminaB12: 2.4, // mcg
};

module.exports = { VALORES_DIARIOS_REFERENCIA };

// Valores diarios de referencia (Daily Values) usados para evaluar alertas
// nutricionales. Son los estándar de la FDA para un adulto promedio — no
// están personalizados por paciente (salvo el objetivo calórico, que sí se
// ajusta con Mifflin-St Jeor cuando hay datos suficientes, ver
// EvaluadorAlertas.js). Quedan como constantes de código por ahora; hacerlos
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

const CALORIAS_MINIMAS_SEGURAS = 1200;
const CALORIAS_MAXIMAS_SEGURAS = 4000;

module.exports = {
  VALORES_DIARIOS_REFERENCIA,
  CALORIAS_MINIMAS_SEGURAS,
  CALORIAS_MAXIMAS_SEGURAS,
};

const { ajusteObjetivo } = require("../../../Alerta/Dominio/Servicios/EvaluadorAlertas");

// Meta de calorías diarias del paciente para guiar a la IA al armar el menú
// (sin una meta concreta la IA elegía porciones demasiado pequeñas).
// Gasto en reposo con Mifflin-St Jeor, multiplicado por el nivel de
// actividad y ajustado por el objetivo (mismo criterio que las alertas:
// -500 kcal para bajar de peso, +500 para subir). Si faltan edad o sexo se
// usan valores intermedios (30 años, promedio entre hombre y mujer).

const FACTORES_ACTIVIDAD = [
  [/sedentari|nada|ninguna/, 1.2],
  [/muy alt|intens|extrem/, 1.9],
  [/lige|baj|leve/, 1.375],
  [/moder|medi/, 1.55],
  [/alt|activ/, 1.725],
];

const MINIMO_SEGURO = { femenino: 1200, masculino: 1500 };

function normalizar(texto) {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function factorActividad(nivelActividad) {
  const texto = normalizar(nivelActividad);
  return FACTORES_ACTIVIDAD.find(([regex]) => regex.test(texto))?.[1] || 1.55;
}

function requerimientoCalorico({ peso, altura, edad, sexo, nivelActividad, objetivo }) {
  const kg = Number(peso);
  const cm = Number(altura) * 100;
  if (!(kg > 0) || !(cm > 0)) return null;

  const anios = Number(edad) > 0 ? Number(edad) : 30;
  const ajusteSexo = sexo === "masculino" ? 5 : sexo === "femenino" ? -161 : -78;
  const reposo = 10 * kg + 6.25 * cm - 5 * anios + ajusteSexo;

  const total = reposo * factorActividad(nivelActividad) + ajusteObjetivo(objetivo);
  const minimo = MINIMO_SEGURO[sexo] || 1350;
  return Math.round(Math.max(total, minimo) / 10) * 10;
}

// Reparto de la meta diaria entre las comidas del día
const REPARTO_POR_MOMENTO = {
  Desayuno: 0.25,
  "Media mañana": 0.1,
  Almuerzo: 0.35,
  Merienda: 0.1,
  Cena: 0.25,
  "Antes de dormir": 0.05,
};

function repartoPorComida(caloriasDia, momentos) {
  const pesos = momentos.map((m) => REPARTO_POR_MOMENTO[m] ?? 1 / momentos.length);
  const suma = pesos.reduce((s, p) => s + p, 0);
  return momentos.map((m, i) => ({
    momento: m,
    calorias: Math.round((caloriasDia * pesos[i]) / suma / 10) * 10,
  }));
}

module.exports = { requerimientoCalorico, repartoPorComida, factorActividad };

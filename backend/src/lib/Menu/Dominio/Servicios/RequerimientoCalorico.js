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

// Detalle del cálculo para mostrarle al profesional de dónde sale la meta
// (fórmula, valores usados y cada paso) y la distribución de macronutrientes:
// proteína según objetivo (g/kg), grasa 30 % de las kcal y carbohidratos el
// resto (dentro de los rangos AMDR del Institute of Medicine).
const NOMBRES_ACTIVIDAD = [
  [1.2, "Sedentario"], [1.375, "Ligero"], [1.55, "Moderado"], [1.725, "Alto"], [1.9, "Muy alto"],
];
const PORCENTAJE_GRASA = 0.3;

function detalleRequerimiento(paciente = {}, { proteinaPorKg } = {}) {
  const kg = Number(paciente.peso);
  const cm = Number(paciente.altura) * 100;
  if (!(kg > 0) || !(cm > 0)) return null;
  const edadDato = Number(paciente.edad) > 0;
  const anios = edadDato ? Number(paciente.edad) : 30;
  const sexo = paciente.sexo === "masculino" || paciente.sexo === "femenino" ? paciente.sexo : null;
  const ajusteSexo = sexo === "masculino" ? 5 : sexo === "femenino" ? -161 : -78;
  const tmb = 10 * kg + 6.25 * cm - 5 * anios + ajusteSexo;
  const factor = factorActividad(paciente.nivelActividad);
  const get = tmb * factor;
  const ajuste = ajusteObjetivo(paciente.objetivo);
  const meta = requerimientoCalorico(paciente);
  const minimo = MINIMO_SEGURO[sexo] || 1350;

  const gPorKg = proteinaPorKg ? proteinaPorKg(paciente.objetivo) : 1;
  const proteinaG = Math.round(kg * gPorKg);
  const grasaKcal = meta * PORCENTAJE_GRASA;
  const grasaG = Math.round(grasaKcal / 9);
  const carbohidratosKcal = Math.max(meta - proteinaG * 4 - grasaG * 9, 0);
  const carbohidratosG = Math.round(carbohidratosKcal / 4);
  const macro = (g, kcalPorG, nota) => ({ gramos: g, kcal: g * kcalPorG, porcentaje: Math.round(((g * kcalPorG) / meta) * 100), nota });

  return {
    formula: "Mifflin-St Jeor (1990)",
    ecuacion: `TMB = 10 × peso (kg) + 6,25 × talla (cm) − 5 × edad (años) ${sexo === "masculino" ? "+ 5" : sexo === "femenino" ? "− 161" : "− 78 (promedio: sexo no indicado)"}`,
    valores: { peso: kg, tallaCm: Math.round(cm), edad: anios, sexo, edadSupuesta: !edadDato, sexoSupuesto: !sexo },
    tmb: Math.round(tmb),
    factorActividad: factor,
    nivelActividad: NOMBRES_ACTIVIDAD.find(([f]) => f === factor)?.[1] || paciente.nivelActividad,
    get: Math.round(get),
    ajusteObjetivo: ajuste,
    objetivo: paciente.objetivo,
    meta,
    minimoAplicado: Math.round(get + ajuste) < minimo,
    minimoSeguro: minimo,
    macronutrientes: {
      proteinas: macro(proteinaG, 4, `${String(gPorKg).replace(".", ",")} g por kg de peso según el objetivo`),
      carbohidratos: macro(carbohidratosG, 4, "Resto de las calorías"),
      grasas: macro(grasaG, 9, "30 % de las calorías"),
    },
    referencias: "TMB: Mifflin-St Jeor (1990). Factores de actividad: FAO/OMS. Rangos aceptables: carbohidratos 45–65 %, grasas 20–35 %, proteínas 10–35 % (Institute of Medicine, 2005).",
  };
}

module.exports = { requerimientoCalorico, repartoPorComida, factorActividad, detalleRequerimiento };

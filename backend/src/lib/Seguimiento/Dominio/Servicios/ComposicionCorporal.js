const { ValidationError } = require("../Errores");

// Medidas corporales (antropometría) de un control de seguimiento y la
// composición corporal que se calcula con ellas. Todo es opcional: la
// nutricionista registra lo que pueda medir con su equipo.
//
// medidas = {
//   cintura, cadera, brazo            (cm, cinta métrica)
//   pliegues: { triceps, biceps, subescapular, suprailiaco }   (mm, plicómetro)
//   grasaPorcentaje, masaMuscularKg   (balanza de bioimpedancia)
// }

const RANGOS = {
  cintura: [40, 200], cadera: [50, 220], brazo: [10, 70],
  pliegue: [2, 80], grasaPorcentaje: [2, 75], masaMuscularKg: [5, 120],
};
const PLIEGUES = ["triceps", "biceps", "subescapular", "suprailiaco"];

function numero(valor, [min, max], etiqueta) {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(String(valor).replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max)
    throw new ValidationError(`${etiqueta} debe estar entre ${min} y ${max}`);
  return Math.round(n * 10) / 10;
}

// Valida y limpia las medidas; null si no se registró ninguna
function normalizarMedidas(medidas) {
  if (medidas === undefined || medidas === null) return null;
  if (typeof medidas !== "object") throw new ValidationError("Las medidas corporales no son válidas");
  const limpias = {
    cintura: numero(medidas.cintura, RANGOS.cintura, "La cintura (cm)"),
    cadera: numero(medidas.cadera, RANGOS.cadera, "La cadera (cm)"),
    brazo: numero(medidas.brazo, RANGOS.brazo, "El brazo (cm)"),
    grasaPorcentaje: numero(medidas.grasaPorcentaje, RANGOS.grasaPorcentaje, "El % de grasa"),
    masaMuscularKg: numero(medidas.masaMuscularKg, RANGOS.masaMuscularKg, "La masa muscular (kg)"),
    pliegues: null,
  };
  const pliegues = {};
  for (const p of PLIEGUES) pliegues[p] = numero(medidas.pliegues?.[p], RANGOS.pliegue, `El pliegue ${p} (mm)`);
  const cuantos = PLIEGUES.filter((p) => pliegues[p] !== null).length;
  if (cuantos > 0 && cuantos < PLIEGUES.length)
    throw new ValidationError("Para calcular la grasa con pliegues se necesitan los 4: tríceps, bíceps, subescapular y suprailíaco");
  if (cuantos === PLIEGUES.length) limpias.pliegues = pliegues;
  const algo = Object.values(limpias).some((v) => v !== null);
  return algo ? limpias : null;
}

// Durnin & Womersley (1974): densidad corporal con la suma de 4 pliegues,
// según sexo y edad. Luego Siri (1961): % grasa = 495 / densidad − 450.
const DURNIN = {
  masculino: [[19, 1.162, 0.063], [29, 1.1631, 0.0632], [39, 1.1422, 0.0544], [49, 1.162, 0.07], [Infinity, 1.1715, 0.0779]],
  femenino: [[19, 1.1549, 0.0678], [29, 1.1599, 0.0717], [39, 1.1423, 0.0632], [49, 1.1333, 0.0612], [Infinity, 1.1339, 0.0645]],
};

function grasaPorPliegues(pliegues, sexo, edad) {
  const tabla = DURNIN[sexo];
  if (!pliegues || !tabla || !(edad > 0)) return null;
  const suma = PLIEGUES.reduce((t, p) => t + pliegues[p], 0);
  const [, c, m] = tabla.find(([hasta]) => edad <= hasta);
  const densidad = c - m * Math.log10(suma);
  const grasa = 495 / densidad - 450;
  return Number.isFinite(grasa) && grasa > 0 ? Math.round(grasa * 10) / 10 : null;
}

// Rangos de % de grasa según sexo y edad (Gallagher et al., 2000):
// [saludable desde, saludable hasta, alto hasta]; más arriba = muy alto
const RANGOS_GRASA = {
  femenino: [[39, 21, 33, 39], [59, 23, 34, 40], [Infinity, 24, 36, 42]],
  masculino: [[39, 8, 20, 25], [59, 11, 22, 28], [Infinity, 13, 25, 30]],
};

function rangoGrasa(sexo, edad) {
  const tabla = RANGOS_GRASA[sexo];
  if (!tabla) return null;
  const [, desde, hasta, alto] = tabla.find(([limite]) => (edad > 0 ? edad : 30) <= limite);
  return { desde, hasta, alto };
}

function evaluarGrasa(porcentaje, rango) {
  if (porcentaje === null || !rango) return null;
  if (porcentaje < rango.desde) return "bajo";
  if (porcentaje <= rango.hasta) return "saludable";
  if (porcentaje <= rango.alto) return "alto";
  return "muy_alto";
}

// Cintura (OMS): riesgo cardiometabólico aumentado / alto
function evaluarCintura(cintura, sexo) {
  if (cintura === null) return null;
  const [aumentado, alto] = sexo === "masculino" ? [94, 102] : [80, 88];
  if (cintura >= alto) return "alto";
  if (cintura >= aumentado) return "aumentado";
  return "saludable";
}

// Índice cintura/cadera (OMS): riesgo si supera 0,90 (hombres) u 0,85 (mujeres)
function evaluarICC(icc, sexo) {
  if (icc === null) return null;
  return icc > (sexo === "masculino" ? 0.9 : 0.85) ? "alto" : "saludable";
}

function evaluarIMC(imc) {
  if (imc === null) return null;
  if (imc < 18.5) return "bajo";
  if (imc < 25) return "saludable";
  if (imc < 30) return "sobrepeso";
  return "obesidad";
}

const redondear = (n, d = 1) => (n === null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);

// Composición corporal de un control. paciente: { edad, sexo, altura (m) }
function calcularComposicion(medidas, peso, paciente = {}) {
  const sexo = String(paciente.sexo || "").toLowerCase();
  const edad = Number(paciente.edad) || null;
  const altura = Number(paciente.altura) || null;
  const kg = Number(peso) > 0 ? Number(peso) : null;
  const m = medidas || {};

  const grasaPliegues = grasaPorPliegues(m.pliegues, sexo, edad);
  const porcentajeGrasa = m.grasaPorcentaje ?? grasaPliegues;
  const metodoGrasa = m.grasaPorcentaje != null ? "bioimpedancia" : grasaPliegues != null ? "pliegues" : null;
  const masaGrasaKg = porcentajeGrasa != null && kg ? redondear((kg * porcentajeGrasa) / 100) : null;
  const masaMagraKg = masaGrasaKg != null ? redondear(kg - masaGrasaKg) : null;
  const imc = kg && altura ? redondear(kg / (altura * altura)) : null;
  const cintura = m.cintura ?? null;
  const icc = cintura && m.cadera ? redondear(cintura / m.cadera, 2) : null;
  const rango = rangoGrasa(sexo, edad);

  return {
    peso: kg,
    imc,
    porcentajeGrasa: porcentajeGrasa ?? null,
    metodoGrasa,
    masaGrasaKg,
    masaMagraKg,
    masaMuscularKg: m.masaMuscularKg ?? null,
    cintura,
    cadera: m.cadera ?? null,
    brazo: m.brazo ?? null,
    indiceCinturaCadera: icc,
    rangoGrasa: rango,
    // Si hay pliegues pero falta el sexo o la edad en la ficha, se avisa
    faltaSexoOEdad: Boolean(m.pliegues) && grasaPliegues === null && m.grasaPorcentaje == null,
    evaluacion: {
      grasa: evaluarGrasa(porcentajeGrasa ?? null, rango),
      cintura: evaluarCintura(cintura, sexo),
      indiceCinturaCadera: evaluarICC(icc, sexo),
      imc: evaluarIMC(imc),
    },
  };
}

// Agrega la composición a cada control que tenga medidas corporales
function conComposicion(registros, paciente) {
  return registros.map((r) => (r.medidas ? { ...r, composicion: calcularComposicion(r.medidas, r.peso, paciente) } : r));
}

module.exports = { normalizarMedidas, calcularComposicion, conComposicion, grasaPorPliegues, PLIEGUES };

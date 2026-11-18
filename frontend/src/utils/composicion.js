// Medidas corporales (antropometría) del seguimiento: formulario y textos.
// Los cálculos (% de grasa, masa magra, rangos) los hace el backend
// (Seguimiento/Dominio/Servicios/ComposicionCorporal.js) y llegan en
// registro.composicion.

export const PLIEGUES = [
  { campo: "triceps", nombre: "Tríceps" },
  { campo: "biceps", nombre: "Bíceps" },
  { campo: "subescapular", nombre: "Subescapular" },
  { campo: "suprailiaco", nombre: "Suprailíaco" },
];

export function medidasVacias() {
  return {
    cintura: "", cadera: "", brazo: "",
    grasaPorcentaje: "", masaMuscularKg: "",
    pliegues: { triceps: "", biceps: "", subescapular: "", suprailiaco: "" },
  };
}

export function medidasDesdeRegistro(medidas) {
  const vacias = medidasVacias();
  if (!medidas) return vacias;
  const texto = (v) => (v === null || v === undefined ? "" : String(v));
  return {
    cintura: texto(medidas.cintura), cadera: texto(medidas.cadera), brazo: texto(medidas.brazo),
    grasaPorcentaje: texto(medidas.grasaPorcentaje), masaMuscularKg: texto(medidas.masaMuscularKg),
    pliegues: Object.fromEntries(PLIEGUES.map(({ campo }) => [campo, texto(medidas.pliegues?.[campo])])),
  };
}

export function hayMedidas(m) {
  if (!m) return false;
  return ["cintura", "cadera", "brazo", "grasaPorcentaje", "masaMuscularKg"].some((k) => String(m[k] ?? "").trim() !== "") ||
    PLIEGUES.some(({ campo }) => String(m.pliegues?.[campo] ?? "").trim() !== "");
}

// Lo que se envía al backend: números o null (null en todo = sin medidas)
export function medidasParaEnviar(m) {
  if (!hayMedidas(m)) return null;
  const n = (v) => (String(v ?? "").trim() === "" ? null : Number(String(v).replace(",", ".")));
  const pliegues = Object.fromEntries(PLIEGUES.map(({ campo }) => [campo, n(m.pliegues?.[campo])]));
  return {
    cintura: n(m.cintura), cadera: n(m.cadera), brazo: n(m.brazo),
    grasaPorcentaje: n(m.grasaPorcentaje), masaMuscularKg: n(m.masaMuscularKg),
    pliegues: PLIEGUES.some(({ campo }) => pliegues[campo] !== null) ? pliegues : null,
  };
}

// Semáforo de cada evaluación
export const SEMAFORO = {
  saludable: { color: "#16a34a", fondo: "#dcfce7", texto: "Saludable" },
  bajo: { color: "#0284c7", fondo: "#e0f2fe", texto: "Bajo" },
  aumentado: { color: "#d97706", fondo: "#fef3c7", texto: "Riesgo aumentado" },
  alto: { color: "#d97706", fondo: "#fef3c7", texto: "Alto" },
  sobrepeso: { color: "#d97706", fondo: "#fef3c7", texto: "Sobrepeso" },
  muy_alto: { color: "#dc2626", fondo: "#fee2e2", texto: "Muy alto" },
  obesidad: { color: "#dc2626", fondo: "#fee2e2", texto: "Obesidad" },
};

export function semaforo(evaluacion) {
  return SEMAFORO[evaluacion] || { color: "#6b7280", fondo: "#f3f4f6", texto: "Sin referencia" };
}

export function formato(n, decimales = 1) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toFixed(decimales).replace(".", ",");
}

// Controles con composición, del más antiguo al más reciente
export function controlesConComposicion(registros = []) {
  return registros
    .filter((r) => r.composicion)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || (a.id ?? 0) - (b.id ?? 0));
}

// Explicaciones sencillas para el paciente
export const EXPLICACION = {
  grasa: "Es la energía que tu cuerpo guarda como reserva. Un poco es necesaria; en exceso aumenta el riesgo de enfermedades.",
  musculo: "Es lo que te da fuerza y ayuda a gastar más energía incluso en reposo. Conviene mantenerla o aumentarla.",
  magra: "Es todo lo que no es grasa: músculos, huesos, agua y órganos.",
  cintura: "La medida de tu cintura indica cuánta grasa hay alrededor del abdomen, la que más influye en tu salud.",
  imc: "Relaciona tu peso con tu estatura. Es una referencia general; tu composición corporal dice más.",
};

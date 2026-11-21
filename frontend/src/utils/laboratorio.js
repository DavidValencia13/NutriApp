// Exámenes de laboratorio de un control (mismos campos y rangos que
// backend/src/lib/Seguimiento/Dominio/Servicios/Laboratorio.js)
export const GRUPOS_LABORATORIO = [
  {
    clave: "glucosa",
    titulo: "Glucosa",
    campos: [
      { campo: "glucosa", nombre: "Glucosa en ayunas", unidad: "mg/dL", ejemplo: "90", referencia: "70–99 normal · 100–125 prediabetes · ≥126 diabetes" },
      { campo: "hba1c", nombre: "HbA1c", unidad: "%", ejemplo: "5,4", referencia: "<5,7 normal · 5,7–6,4 prediabetes · ≥6,5 diabetes" },
    ],
  },
  {
    clave: "lipidos",
    titulo: "Perfil lipídico",
    campos: [
      { campo: "colesterolTotal", nombre: "Colesterol total", unidad: "mg/dL", ejemplo: "180", referencia: "<200 deseable · 200–239 límite · ≥240 alto" },
      { campo: "ldl", nombre: "LDL", unidad: "mg/dL", ejemplo: "110", referencia: "<130 · 130–159 límite · ≥160 alto" },
      { campo: "hdl", nombre: "HDL", unidad: "mg/dL", ejemplo: "55", referencia: "Bajo: <50 mujeres · <40 hombres" },
      { campo: "trigliceridos", nombre: "Triglicéridos", unidad: "mg/dL", ejemplo: "120", referencia: "<150 normal · 150–199 límite · ≥200 alto" },
    ],
  },
  {
    clave: "biometria",
    titulo: "Biometría hemática",
    campos: [
      { campo: "hemoglobina", nombre: "Hemoglobina", unidad: "g/dL", ejemplo: "13,5", referencia: "Mujeres 12–16 · hombres 13–17,5" },
      { campo: "hematocrito", nombre: "Hematocrito", unidad: "%", ejemplo: "40", referencia: "Mujeres 36–46 · hombres 40–52" },
      { campo: "leucocitos", nombre: "Leucocitos", unidad: "mil/µL", ejemplo: "7,2", referencia: "4–11 mil/µL" },
      { campo: "plaquetas", nombre: "Plaquetas", unidad: "mil/µL", ejemplo: "250", referencia: "150–450 mil/µL" },
    ],
  },
];

export const CAMPOS_LAB = GRUPOS_LABORATORIO.flatMap((g) => g.campos);

export const ESTADOS_LAB = {
  normal: { texto: "Normal", clase: "bg-emerald-100 text-emerald-800" },
  limite: { texto: "Límite", clase: "bg-amber-100 text-amber-800" },
  alto: { texto: "Alto", clase: "bg-rose-100 text-rose-800" },
  bajo: { texto: "Bajo", clase: "bg-sky-100 text-sky-800" },
};

export function laboratorioDesdeRegistro(laboratorio) {
  return Object.fromEntries(CAMPOS_LAB.map(({ campo }) => [campo, laboratorio?.[campo] != null ? String(laboratorio[campo]).replace(".", ",") : ""]));
}

export function hayLaboratorio(form) {
  return Object.values(form || {}).some((v) => String(v ?? "").trim() !== "");
}

// Vacío = null (sin exámenes en este control)
export function laboratorioParaEnviar(form) {
  const datos = {};
  for (const { campo } of CAMPOS_LAB) {
    const v = String(form?.[campo] ?? "").trim();
    if (v) datos[campo] = v.replace(",", ".");
  }
  return Object.keys(datos).length ? datos : null;
}

export const fmtLab = (n) => Number(n).toLocaleString("es-EC", { maximumFractionDigits: 2 });

const { ValidationError } = require("../Errores");

// Exámenes de laboratorio básicos de un control (todos opcionales). Sirven
// para el control entre citas (paciente prediabético, colesterol alto...),
// no cambian el menú. Cada valor se compara con su rango de referencia en
// adultos:
// - Glucosa en ayunas y HbA1c: American Diabetes Association (2024).
// - Colesterol total, LDL, HDL y triglicéridos: NCEP ATP III.
// - Biometría hemática (hemoglobina, hematocrito, leucocitos, plaquetas):
//   valores de referencia habituales en adultos (OMS para anemia).
// estado: "bajo" | "normal" | "limite" | "alto"
const CAMPOS = {
  glucosa: { nombre: "Glucosa en ayunas", unidad: "mg/dL", rango: [20, 600], grupo: "glucosa" },
  hba1c: { nombre: "Hemoglobina glicosilada (HbA1c)", unidad: "%", rango: [3, 20], grupo: "glucosa" },
  colesterolTotal: { nombre: "Colesterol total", unidad: "mg/dL", rango: [50, 600], grupo: "lipidos" },
  ldl: { nombre: "Colesterol LDL", unidad: "mg/dL", rango: [10, 400], grupo: "lipidos" },
  hdl: { nombre: "Colesterol HDL", unidad: "mg/dL", rango: [5, 200], grupo: "lipidos" },
  trigliceridos: { nombre: "Triglicéridos", unidad: "mg/dL", rango: [10, 3000], grupo: "lipidos" },
  hemoglobina: { nombre: "Hemoglobina", unidad: "g/dL", rango: [3, 25], grupo: "biometria" },
  hematocrito: { nombre: "Hematocrito", unidad: "%", rango: [10, 75], grupo: "biometria" },
  leucocitos: { nombre: "Leucocitos", unidad: "mil/µL", rango: [0.5, 100], grupo: "biometria" },
  plaquetas: { nombre: "Plaquetas", unidad: "mil/µL", rango: [10, 2000], grupo: "biometria" },
};

function normalizarLaboratorio(laboratorio) {
  if (laboratorio === undefined || laboratorio === null) return null;
  if (typeof laboratorio !== "object") throw new ValidationError("Los exámenes de laboratorio no son válidos");
  const limpio = {};
  for (const [campo, def] of Object.entries(CAMPOS)) {
    const crudo = laboratorio[campo];
    if (crudo === undefined || crudo === null || crudo === "") continue;
    const n = Number(String(crudo).replace(",", "."));
    const [min, max] = def.rango;
    if (!Number.isFinite(n) || n < min || n > max)
      throw new ValidationError(`${def.nombre}: escribe un valor entre ${min} y ${max} ${def.unidad}`);
    limpio[campo] = Math.round(n * 100) / 100;
  }
  return Object.keys(limpio).length ? limpio : null;
}

function entre(valor, cortes) {
  // cortes: [[hasta, estado], ...] ; el último es el de más arriba
  for (const [hasta, estado] of cortes) if (valor < hasta) return estado;
  return cortes.at(-1)[1];
}

function evaluarCampo(campo, valor, sexo) {
  const mujer = sexo === "femenino";
  const hombre = sexo === "masculino";
  switch (campo) {
    case "glucosa": return entre(valor, [[70, "bajo"], [100, "normal"], [126, "limite"], [Infinity, "alto"]]);
    case "hba1c": return entre(valor, [[5.7, "normal"], [6.5, "limite"], [Infinity, "alto"]]);
    case "colesterolTotal": return entre(valor, [[200, "normal"], [240, "limite"], [Infinity, "alto"]]);
    case "ldl": return entre(valor, [[130, "normal"], [160, "limite"], [Infinity, "alto"]]);
    case "hdl": return valor < (hombre ? 40 : 50) ? "bajo" : "normal";
    case "trigliceridos": return entre(valor, [[150, "normal"], [200, "limite"], [Infinity, "alto"]]);
    case "hemoglobina": {
      const [desde, hasta] = mujer ? [12, 16] : hombre ? [13, 17.5] : [12, 17.5];
      return valor < desde ? "bajo" : valor > hasta ? "alto" : "normal";
    }
    case "hematocrito": {
      const [desde, hasta] = mujer ? [36, 46] : hombre ? [40, 52] : [36, 52];
      return valor < desde ? "bajo" : valor > hasta ? "alto" : "normal";
    }
    case "leucocitos": return valor < 4 ? "bajo" : valor > 11 ? "alto" : "normal";
    case "plaquetas": return valor < 150 ? "bajo" : valor > 450 ? "alto" : "normal";
    default: return null;
  }
}

// { campo: estado } de los valores registrados
function evaluarLaboratorio(laboratorio, sexo) {
  if (!laboratorio) return null;
  const s = String(sexo || "").toLowerCase();
  const evaluacion = {};
  for (const [campo, valor] of Object.entries(laboratorio)) {
    if (CAMPOS[campo] && Number.isFinite(Number(valor))) evaluacion[campo] = evaluarCampo(campo, Number(valor), s);
  }
  return evaluacion;
}

module.exports = { CAMPOS_LABORATORIO: CAMPOS, normalizarLaboratorio, evaluarLaboratorio };

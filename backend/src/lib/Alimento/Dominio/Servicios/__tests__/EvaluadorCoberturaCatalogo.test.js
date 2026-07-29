const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluar,
  terminosADetectar,
  esFuenteDe,
} = require("../EvaluadorCoberturaCatalogo");

const pacienteBase = {
  objetivo: "Mantener peso",
  restricciones: "Ninguna",
  alergias: [],
  enfermedades: [],
};

// Alimento con datos nutricionales suficientes para cubrir los NUTRIENTES_CLAVE
// (valores por 100g, todos por encima del 10% del DV).
function alimento(nombre, gruposAlimenticios, extra = {}) {
  return {
    id: nombre,
    nombre,
    unidadMedida: "g",
    gruposAlimenticios,
    infoNutricional: {
      refUnidad: "g",
      refCantidad: 100,
      proteinas: 20,
      fibra: 5,
      calcio: 200,
      hierro: 3,
      vitaminaC: 20,
      vitaminaA: 150,
      potasio: 600,
      ...extra,
    },
  };
}

// Catálogo que cubre los 6 grupos esenciales con la variedad mínima exigida.
function catalogoCompleto() {
  return [
    alimento("Pollo", ["proteinas"]),
    alimento("Huevo", ["proteinas"]),
    alimento("Atun", ["proteinas"]),
    alimento("Brocoli", ["verduras_hortalizas"]),
    alimento("Espinaca", ["verduras_hortalizas"]),
    alimento("Zanahoria", ["verduras_hortalizas"]),
    alimento("Arroz", ["granos_cereales"]),
    alimento("Avena", ["granos_cereales"]),
    alimento("Manzana", ["frutas"]),
    alimento("Naranja", ["frutas"]),
    alimento("Aceite de oliva", ["grasas_saludables"]),
    alimento("Yogur", ["lacteos"]),
  ];
}

function tipos(resultado) {
  return resultado.alertas.map((a) => a.tipo);
}

test("catálogo vacío: crítico y no listo para menú", () => {
  const resultado = evaluar({ paciente: pacienteBase, alimentos: [] });

  assert.equal(resultado.listoParaMenu, false);
  assert.ok(tipos(resultado).includes("catalogo_vacio"));
  assert.equal(resultado.resumen.totalAlimentos, 0);
});

test("sin alertas cuando el catálogo cubre grupos esenciales y nutrientes clave", () => {
  const resultado = evaluar({ paciente: pacienteBase, alimentos: catalogoCompleto() });

  assert.deepEqual(resultado.alertas, []);
  assert.equal(resultado.listoParaMenu, true);
  assert.equal(resultado.resumen.esencialesCubiertos, resultado.resumen.esencialesTotal);
});

test("avisa cuando falta un grupo esencial completo", () => {
  const sinLacteos = catalogoCompleto().filter((a) => a.nombre !== "Yogur");
  const resultado = evaluar({ paciente: pacienteBase, alimentos: sinLacteos });

  assert.ok(tipos(resultado).includes("grupo_ausente_lacteos"));
  // Lácteos es advertencia, no crítica: el calcio puede venir de otra fuente.
  assert.equal(resultado.listoParaMenu, true);
});

test("la ausencia de proteínas es crítica y sugiere legumbres como alternativa", () => {
  const sinProteinas = catalogoCompleto().filter(
    (a) => !a.gruposAlimenticios.includes("proteinas"),
  );
  const resultado = evaluar({ paciente: pacienteBase, alimentos: sinProteinas });

  const alerta = resultado.alertas.find((a) => a.tipo === "grupo_ausente_proteinas");
  assert.equal(alerta.nivel, "critica");
  assert.ok(alerta.gruposSugeridos.includes("legumbres"));
  assert.equal(resultado.listoParaMenu, false);
});

test("legumbres cuentan como fuente alternativa de proteína", () => {
  const conLegumbres = catalogoCompleto()
    .filter((a) => !a.gruposAlimenticios.includes("proteinas"))
    .concat([
      alimento("Lentejas", ["legumbres"]),
      alimento("Garbanzos", ["legumbres"]),
      alimento("Frijoles", ["legumbres"]),
    ]);
  const resultado = evaluar({ paciente: pacienteBase, alimentos: conLegumbres });

  assert.equal(tipos(resultado).includes("grupo_ausente_proteinas"), false);
});

test("avisa por poca variedad aunque el grupo esté presente", () => {
  const unaProteina = catalogoCompleto().filter(
    (a) => !["Huevo", "Atun"].includes(a.nombre),
  );
  const resultado = evaluar({ paciente: pacienteBase, alimentos: unaProteina });

  const alerta = resultado.alertas.find((a) => a.tipo === "grupo_poca_variedad_proteinas");
  // Un escalón bajo el nivel del grupo: hay fuente, el problema es que se
  // repetiría los 7 días, no que falte.
  assert.equal(alerta.nivel, "advertencia");
  assert.ok(alerta.mensaje.includes("1 opción"));
  assert.equal(resultado.listoParaMenu, true);
});

test("nombra los alimentos sin información nutricional", () => {
  const alimentos = catalogoCompleto();
  delete alimentos[0].infoNutricional;
  const resultado = evaluar({ paciente: pacienteBase, alimentos });

  const alerta = resultado.alertas.find((a) => a.tipo === "alimentos_sin_info_nutricional");
  assert.equal(alerta.nivel, "advertencia");
  assert.ok(alerta.mensaje.includes("Pollo"));
  assert.equal(resultado.resumen.conInfoNutricional, alimentos.length - 1);
});

test("si NINGÚN alimento tiene info nutricional: crítico y no evalúa nutrientes", () => {
  const alimentos = catalogoCompleto().map(({ infoNutricional, ...resto }) => resto);
  const resultado = evaluar({ paciente: pacienteBase, alimentos });

  const alerta = resultado.alertas.find((a) => a.tipo === "alimentos_sin_info_nutricional");
  assert.equal(alerta.nivel, "critica");
  // Sin datos, las alertas por nutriente serían ruido sobre la causa raíz.
  assert.equal(tipos(resultado).some((t) => t.startsWith("sin_fuente_")), false);
});

test("avisa cuando ningún alimento es fuente relevante de un nutriente clave", () => {
  const sinCalcio = catalogoCompleto().map((a) => ({
    ...a,
    infoNutricional: { ...a.infoNutricional, calcio: 1 },
  }));
  const resultado = evaluar({ paciente: pacienteBase, alimentos: sinCalcio });

  assert.ok(tipos(resultado).includes("sin_fuente_calcio"));
  assert.equal(tipos(resultado).includes("sin_fuente_hierro"), false);
});

test("detecta un alimento incompatible con una alergia registrada", () => {
  const paciente = { ...pacienteBase, alergias: ["maní"] };
  const alimentos = catalogoCompleto().concat(
    alimento("Crema de mani", ["grasas_saludables"]),
  );
  const resultado = evaluar({ paciente, alimentos });

  const alerta = resultado.alertas.find((a) => a.tipo.startsWith("alimento_alergia_"));
  assert.equal(alerta.nivel, "critica");
  assert.ok(alerta.mensaje.includes("Crema de mani"));
  assert.equal(resultado.listoParaMenu, false);
});

test("detecta alimentos que chocan con una restricción vía sinónimo", () => {
  const paciente = { ...pacienteBase, restricciones: "Sin gluten" };
  const alimentos = catalogoCompleto().concat(
    alimento("Pan integral", ["granos_cereales"]),
  );
  const resultado = evaluar({ paciente, alimentos });

  const alerta = resultado.alertas.find((a) => a.tipo.startsWith("alimento_restriccion_"));
  // Advertencia, no crítica: restricciones es texto libre y la coincidencia
  // por nombre puede equivocarse.
  assert.equal(alerta.nivel, "advertencia");
  assert.ok(alerta.mensaje.includes("Pan integral"));
});

test("ignora restricciones vacías como 'Ninguna'", () => {
  const paciente = { ...pacienteBase, restricciones: "Ninguna" };
  const alimentos = catalogoCompleto().concat(
    alimento("Pan integral", ["granos_cereales"]),
  );
  const resultado = evaluar({ paciente, alimentos });

  assert.equal(
    tipos(resultado).some((t) => t.startsWith("alimento_restriccion_")),
    false,
  );
});

test("objetivo bajar peso: pide fuentes de fibra/saciedad", () => {
  const paciente = { ...pacienteBase, objetivo: "Bajar Peso" };
  const pocasVerduras = catalogoCompleto().filter(
    (a) => !["Espinaca", "Zanahoria", "Manzana", "Naranja"].includes(a.nombre),
  );
  const resultado = evaluar({ paciente, alimentos: pocasVerduras });

  assert.ok(tipos(resultado).includes("objetivo_bajar_peso_pocas_fuentes_saciedad"));
});

test("objetivo subir peso: pide fuentes densas en energía", () => {
  const paciente = { ...pacienteBase, objetivo: "Aumentar masa muscular" };
  const sinDensos = catalogoCompleto().filter(
    (a) => !["Aceite de oliva", "Yogur"].includes(a.nombre),
  );
  const resultado = evaluar({ paciente, alimentos: sinDensos });

  assert.ok(tipos(resultado).includes("objetivo_subir_peso_pocas_fuentes_densas"));
});

test("avisa cuando los procesados dominan el catálogo", () => {
  const alimentos = catalogoCompleto().concat([
    alimento("Galletas", ["procesados"]),
    alimento("Papas fritas", ["procesados"]),
    alimento("Refresco", ["procesados"]),
    alimento("Salchicha", ["procesados"]),
    alimento("Nuggets", ["procesados"]),
    alimento("Sopa instantanea", ["procesados"]),
  ]);
  const resultado = evaluar({ paciente: pacienteBase, alimentos });

  assert.ok(tipos(resultado).includes("exceso_procesados"));
});

test("terminosADetectar: extrae el ingrediente de la restricción en prosa y suma sinónimos", () => {
  assert.ok(terminosADetectar("Sin gluten").includes("trigo"));
  assert.ok(terminosADetectar("Evitar lácteos").includes("queso"));
  assert.ok(terminosADetectar("Bajo en sodio").includes("embutido"));
});

test("terminosADetectar: devuelve el término tal cual si no tiene sinónimos conocidos", () => {
  assert.deepEqual(terminosADetectar("Sin kiwi"), ["kiwi"]);
});

test("esFuenteDe: exige al menos 10% del valor diario de referencia", () => {
  // DV calcio = 1300mg → umbral 130mg
  assert.equal(esFuenteDe({ infoNutricional: { calcio: 200 } }, "calcio"), true);
  assert.equal(esFuenteDe({ infoNutricional: { calcio: 50 } }, "calcio"), false);
  assert.equal(esFuenteDe({ infoNutricional: {} }, "calcio"), false);
  assert.equal(esFuenteDe({}, "calcio"), false);
});

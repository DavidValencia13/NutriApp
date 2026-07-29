const test = require("node:test");
const assert = require("node:assert/strict");

const { generar } = require("../GeneradorSugerencias");

const pacienteBase = {
  peso: 70,
  altura: 1.7,
  objetivo: "Mantener peso",
  nivelActividad: "Moderado",
  alergias: [],
  enfermedades: [],
};

function resumen(nutrientesSemanales) {
  return { nutrientes: nutrientesSemanales, completo: true, camposFaltantes: [] };
}

function alimento(id, nombre, gruposAlimenticios, infoNutricional) {
  return { id, nombre, gruposAlimenticios, infoNutricional };
}

test("no genera sugerencia de proteína si el campo no está en el resumen (datos ausentes, no cero)", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(sugerencias.some((s) => s.tipo === "proteina_baja"), false);
});

test("proteina_baja: bajo 70% DV, sugiere alimentos del grupo proteinas no usados", () => {
  const pollo = alimento("1", "Pollo", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 30 });
  const arroz = alimento("2", "Arroz", ["carbohidratos"], { refCantidad: 100, refUnidad: "g" });
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [pollo, arroz],
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 30 }), // 30g/día, DV=50 => 60%
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "proteina_baja");
  assert.ok(sugerencia);
  assert.equal(sugerencia.mensaje, "El menú tiene poca proteína");
  assert.deepEqual(sugerencia.alimentosSugeridos, [{ id: "1", nombre: "Pollo", aporte: "30g por 100g" }]);
});

test("no sugiere alimentos ya usados en el menú", () => {
  const pollo = alimento("1", "Pollo", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 30 });
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [pollo],
    alimentosDisponibles: [pollo],
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 30 }),
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "proteina_baja");
  assert.equal(sugerencia.alimentosSugeridos.length, 0);
});

test("no sugiere alimentos que coincidan con una alergia del paciente", () => {
  const mani = alimento("1", "Mantequilla de mani", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 25 });
  const soya = alimento("2", "Tofu de soya", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 20 });
  const sugerencias = generar({
    paciente: { ...pacienteBase, alergias: ["maní"] },
    alimentosUsados: [],
    alimentosDisponibles: [mani, soya],
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 30 }),
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "proteina_baja");
  assert.deepEqual(sugerencia.alimentosSugeridos, [{ id: "2", nombre: "Tofu de soya", aporte: "20g por 100g" }]);
});

test("no sugiere un alimento como fuente de un nutriente si aporta menos del 5% del valor diario (umbral de relevancia)", () => {
  // Potasio DV=4700mg → umbral=235mg. 50mg es una traza, no lo vuelve
  // "fuente de potasio" aunque el campo esté cargado.
  const carne = alimento("1", "Carne de res", ["proteinas"], { refCantidad: 100, refUnidad: "g", potasio: 50 });
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [carne],
    resumenNutricionalSemanal: resumen({ potasio: 7 * 1000 }), // bajo 50% DV
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "micronutriente_bajo_potasio");
  assert.ok(sugerencia);
  assert.deepEqual(sugerencia.alimentosSugeridos, []);
});

test("sí sugiere un alimento cuando su aporte del nutriente supera el umbral de relevancia", () => {
  const carne = alimento("1", "Carne de res", ["proteinas"], { refCantidad: 100, refUnidad: "g", potasio: 370 });
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [carne],
    resumenNutricionalSemanal: resumen({ potasio: 7 * 1000 }),
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "micronutriente_bajo_potasio");
  assert.deepEqual(sugerencia.alimentosSugeridos, [{ id: "1", nombre: "Carne de res", aporte: "370mg por 100g" }]);
});

test("aporte: usa 'porción(es)' como referencia cuando el alimento declara refUnidad porcion", () => {
  const yogur = alimento("1", "Yogur griego", ["lacteos"], {
    refCantidad: 1,
    refUnidad: "porcion",
    gramosPorPorcion: 150,
    calcio: 200,
  });
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [yogur],
    resumenNutricionalSemanal: resumen({ calcio: 7 * 300 }), // bajo 50% DV
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "calcio_bajo");
  assert.equal(sugerencia.alimentosSugeridos[0].aporte, "200mg por 1 porción");
});

test("fibra_baja: bajo 70% DV", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({ fibra: 7 * 10 }), // DV=28 => ~36%
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "fibra_baja");
  assert.ok(sugerencia);
  assert.equal(sugerencia.mensaje, "Se recomienda añadir una fuente de fibra");
});

test("grasas_saludables_ausentes: si el grupo nunca fue usado, independiente del resumen nutricional", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [{ id: "1", nombre: "Pollo", gruposAlimenticios: ["proteinas"] }],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.ok(sugerencias.find((s) => s.tipo === "grasas_saludables_ausentes"));
});

test("no sugiere grasas saludables si el grupo ya fue usado", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [{ id: "1", nombre: "Palta", gruposAlimenticios: ["grasas_saludables"] }],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(sugerencias.some((s) => s.tipo === "grasas_saludables_ausentes"), false);
});

test("sodio_alto: sobre DV, sin sugerencia de alimentos (es de reducir, no de añadir)", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({ sodio: 7 * 2500 }), // DV=2300
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "sodio_alto");
  assert.ok(sugerencia);
  assert.equal(sugerencia.mensaje, "La cantidad de sodio supera el valor recomendado");
  assert.deepEqual(sugerencia.alimentosSugeridos, []);
});

test("hierro_bajo y calcio_bajo: bajo 50% DV", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({ hierro: 7 * 2, calcio: 7 * 2000 }), // hierro bajo, calcio ok
  });
  assert.ok(sugerencias.find((s) => s.tipo === "hierro_bajo"));
  assert.equal(sugerencias.some((s) => s.tipo === "calcio_bajo"), false);
});

test("frutas_verduras_faltantes: si ninguno de los dos grupos fue usado", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [{ id: "1", nombre: "Pollo", gruposAlimenticios: ["proteinas"] }],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.ok(sugerencias.find((s) => s.tipo === "frutas_verduras_faltantes"));
});

test("no sugiere frutas/verduras si al menos uno de los grupos ya fue usado", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [{ id: "1", nombre: "Manzana", gruposAlimenticios: ["frutas"] }],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(sugerencias.some((s) => s.tipo === "frutas_verduras_faltantes"), false);
});

test("carbohidratos_desbalanceados: sobre 130% DV, sin sugerencia de alimentos", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({ carbohidratos: 7 * 400 }), // DV=275
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "carbohidratos_desbalanceados");
  assert.ok(sugerencia);
  assert.deepEqual(sugerencia.alimentosSugeridos, []);
});

test("micronutriente_bajo_X genérico: bajo 50% DV para vitaminas/minerales sin grupo asociado", () => {
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: [],
    resumenNutricionalSemanal: resumen({ magnesio: 7 * 100 }), // DV=420 => ~24%
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "micronutriente_bajo_magnesio");
  assert.ok(sugerencia);
  assert.equal(sugerencia.mensaje, "El menú tiene un bajo contenido de magnesio");
});

test("limita a un máximo de 3 alimentos sugeridos, priorizando mayor aporte del nutriente", () => {
  const candidatos = [
    alimento("1", "Bajo", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 10 }),
    alimento("2", "Medio", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 20 }),
    alimento("3", "Alto", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 30 }),
    alimento("4", "Extra", ["proteinas"], { refCantidad: 100, refUnidad: "g", proteinas: 5 }),
  ];
  const sugerencias = generar({
    paciente: pacienteBase,
    alimentosUsados: [],
    alimentosDisponibles: candidatos,
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 30 }),
  });
  const sugerencia = sugerencias.find((s) => s.tipo === "proteina_baja");
  assert.equal(sugerencia.alimentosSugeridos.length, 3);
  assert.deepEqual(
    sugerencia.alimentosSugeridos.map((a) => a.nombre),
    ["Alto", "Medio", "Bajo"],
  );
});

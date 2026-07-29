const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluar, calcularObjetivoCalorico } = require("../EvaluadorAlertas");

const pacienteBase = {
  peso: 70,
  altura: 1.7,
  objetivo: "Mantener peso",
  nivelActividad: "Moderado",
  alergias: [],
  enfermedades: [],
};

function resumen(nutrientesSemanales, completo = true, camposFaltantes = []) {
  return { nutrientes: nutrientesSemanales, completo, camposFaltantes };
}

test("no genera alertas de nutrientes si el campo no está en el resumen (datos ausentes, no cero)", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(alertas.some((a) => a.tipo === "proteina_insuficiente"), false);
});

test("proteina_insuficiente: advertencia bajo 70% DV, crítica bajo 40% DV", () => {
  const advertencia = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 30 }), // 30g/día, DV=50 => 60%
  });
  assert.ok(advertencia.find((a) => a.tipo === "proteina_insuficiente" && a.nivel === "advertencia"));

  const critica = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ proteinas: 7 * 15 }), // 15g/día => 30%
  });
  assert.ok(critica.find((a) => a.tipo === "proteina_insuficiente" && a.nivel === "critica"));
});

test("sodio_exceso: advertencia sobre DV, crítica sobre 150% DV", () => {
  const advertencia = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ sodio: 7 * 2500 }), // DV=2300
  });
  assert.ok(advertencia.find((a) => a.tipo === "sodio_exceso" && a.nivel === "advertencia"));

  const critica = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ sodio: 7 * 4000 }),
  });
  assert.ok(critica.find((a) => a.tipo === "sodio_exceso" && a.nivel === "critica"));
});

test("micronutriente_bajo: una alerta por cada micronutriente bajo 50% DV", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ hierro: 7 * 2, calcio: 7 * 2000 }), // hierro bajo, calcio ok
  });
  assert.ok(alertas.find((a) => a.tipo === "micronutriente_bajo_hierro"));
  assert.equal(alertas.some((a) => a.tipo === "micronutriente_bajo_calcio"), false);
});

test("alergia_incompatible: coincidencia de texto sin tildes, siempre crítica", () => {
  const alertas = evaluar({
    paciente: { ...pacienteBase, alergias: ["maní"] },
    alimentosUsados: [{ nombre: "Mantequilla de mani", gruposAlimenticios: [] }],
    resumenNutricionalSemanal: resumen({}),
  });
  const alerta = alertas.find((a) => a.nivel === "critica" && a.mensaje.includes("mani"));
  assert.ok(alerta);
});

test("no genera alerta de alergia si el alimento no coincide", () => {
  const alertas = evaluar({
    paciente: { ...pacienteBase, alergias: ["maní"] },
    alimentosUsados: [{ nombre: "Arroz", gruposAlimenticios: [] }],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(alertas.some((a) => a.tipo.startsWith("alergia_")), false);
});

test("enfermedad_alimento_no_recomendado: diabetes + azúcares altos → advertencia (nunca crítica)", () => {
  const alertas = evaluar({
    paciente: { ...pacienteBase, enfermedades: ["Diabetes tipo 2"] },
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ azucares: 7 * 30 }),
  });
  const alerta = alertas.find((a) => a.tipo === "enfermedad_diabetes_azucares");
  assert.ok(alerta);
  assert.equal(alerta.nivel, "advertencia");
});

test("sin la enfermedad registrada, no se genera la alerta aunque el nutriente esté alto", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ azucares: 7 * 30 }),
  });
  assert.equal(alertas.some((a) => a.tipo === "enfermedad_diabetes_azucares"), false);
});

test("calorias_fuera_de_rango_seguro: crítica fuera del piso/techo genérico", () => {
  const bajo = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ calorias: 7 * 900 }),
  });
  assert.ok(bajo.find((a) => a.tipo === "calorias_fuera_de_rango_seguro" && a.nivel === "critica"));

  const alto = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ calorias: 7 * 4500 }),
  });
  assert.ok(alto.find((a) => a.tipo === "calorias_fuera_de_rango_seguro" && a.nivel === "critica"));
});

test("calcularObjetivoCalorico: null sin edad/sexo, número con edad/sexo/actividad", () => {
  assert.equal(calcularObjetivoCalorico(pacienteBase), null);

  const objetivo = calcularObjetivoCalorico({
    ...pacienteBase,
    edad: 30,
    sexo: "femenino",
  });
  assert.ok(Number.isFinite(objetivo) && objetivo > 0);
});

test("calorias_desviadas_objetivo: advertencia si se desvía >20% del objetivo personalizado", () => {
  const paciente = { ...pacienteBase, edad: 30, sexo: "femenino", objetivo: "Mantener peso" };
  const objetivo = calcularObjetivoCalorico(paciente);
  const alertas = evaluar({
    paciente,
    alimentosUsados: [],
    resumenNutricionalSemanal: resumen({ calorias: 7 * (objetivo * 1.5) }), // muy por encima
  });
  assert.ok(alertas.find((a) => a.tipo === "calorias_desviadas_objetivo"));
});

test("menu_poco_variado: advertencia si se usan menos de 5 grupos alimenticios", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [
      { nombre: "Pollo", gruposAlimenticios: ["proteinas"] },
      { nombre: "Arroz", gruposAlimenticios: ["carbohidratos"] },
    ],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.ok(alertas.find((a) => a.tipo === "menu_poco_variado"));
});

test("no alerta variedad si se cubren 5 o más grupos", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [
      { nombre: "Pollo", gruposAlimenticios: ["proteinas"] },
      { nombre: "Arroz", gruposAlimenticios: ["carbohidratos"] },
      { nombre: "Palta", gruposAlimenticios: ["grasas_saludables"] },
      { nombre: "Lentejas", gruposAlimenticios: ["legumbres"] },
      { nombre: "Manzana", gruposAlimenticios: ["frutas"] },
    ],
    resumenNutricionalSemanal: resumen({}),
  });
  assert.equal(alertas.some((a) => a.tipo === "menu_poco_variado"), false);
});

test("datos_nutricionales_faltantes: informativa cuando el resumen está incompleto, nombra los alimentos sin info", () => {
  const alertas = evaluar({
    paciente: pacienteBase,
    alimentosUsados: [
      { nombre: "Lechuga", gruposAlimenticios: [], infoNutricional: undefined },
      { nombre: "Pollo", gruposAlimenticios: [], infoNutricional: { refCantidad: 100, refUnidad: "g", calorias: 165 } },
    ],
    resumenNutricionalSemanal: resumen({ calorias: 7 * 2000 }, false, ["fibra", "hierro"]),
  });
  const alerta = alertas.find((a) => a.tipo === "datos_nutricionales_faltantes");
  assert.ok(alerta);
  assert.equal(alerta.nivel, "informativa");
  assert.ok(alerta.mensaje.includes("Lechuga"));
  assert.equal(alerta.mensaje.includes("Pollo"), false);
});

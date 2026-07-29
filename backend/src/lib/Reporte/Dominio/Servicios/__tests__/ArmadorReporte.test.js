const test = require("node:test");
const assert = require("node:assert/strict");

const { armar, calcularDistribucionMacros, esAlertaDeNutriente } = require("../ArmadorReporte");

const pacienteBase = {
  id: 1,
  nombre: "Ana",
  peso: 68,
  pesoInicial: 72,
  altura: 1.65,
  objetivo: "Bajar de peso",
  alergias: [],
  enfermedades: [],
};

const menuBase = {
  id: 10,
  estado: "aprobado",
  fechaInicio: "2026-01-01",
  fechaFin: "2026-01-07",
  dias: [
    {
      numeroDia: 1,
      caloriasTotales: 1800,
      nutrientes: { nutrientes: { calorias: 1800 }, completo: true, camposFaltantes: [] },
      comidas: [
        {
          tipoComida: "Desayuno",
          nombrePlato: "Avena con fruta",
          calorias: 400,
          detalles: [{ nombreAlimento: "Avena", cantidadUtilizada: 50, unidadMedida: "g" }],
        },
      ],
    },
  ],
};

function datosBase(overrides = {}) {
  return {
    paciente: pacienteBase,
    menu: menuBase,
    resumenNutricionalSemanal: { nutrientes: { proteinas: 350, carbohidratos: 1000, grasasTotales: 400 }, completo: true, camposFaltantes: [] },
    alertas: [],
    consultas: [],
    resumenCumplimiento: { totalRegistros: 0, porcentajeCumplimiento: null },
    efectividad: { indicador: "informacion_insuficiente", motivos: [], detalle: {} },
    sugerencias: [],
    recomendacionesGuardadas: [],
    ...overrides,
  };
}

test("calcularDistribucionMacros: reparte el % de calorías entre proteínas/carbohidratos/grasas", () => {
  // 100g proteína (400kcal) + 100g carb (400kcal) + 100g grasa (900kcal) = 1700kcal
  const distribucion = calcularDistribucionMacros({ proteinas: 100, carbohidratos: 100, grasasTotales: 100 });
  assert.equal(distribucion.proteinasPorcentaje, Math.round((400 / 1700) * 100));
  assert.equal(distribucion.carbohidratosPorcentaje, Math.round((400 / 1700) * 100));
  assert.equal(distribucion.grasasPorcentaje, Math.round((900 / 1700) * 100));
});

test("calcularDistribucionMacros: null si falta algún macronutriente", () => {
  assert.equal(calcularDistribucionMacros({ proteinas: 100, carbohidratos: 100 }), null);
  assert.equal(calcularDistribucionMacros(undefined), null);
});

test("esAlertaDeNutriente: distingue alertas de nutrientes de otras (alergia, variedad, etc.)", () => {
  assert.equal(esAlertaDeNutriente("proteina_insuficiente"), true);
  assert.equal(esAlertaDeNutriente("micronutriente_bajo_hierro"), true);
  assert.equal(esAlertaDeNutriente("alergia_mani_mani"), false);
  assert.equal(esAlertaDeNutriente("menu_poco_variado"), false);
});

test("armar: separa alertas de nutrientes del resto de alertas", () => {
  const reporte = armar(
    datosBase({
      alertas: [
        { tipo: "proteina_insuficiente", nivel: "advertencia", estado: "pendiente", mensaje: "poca proteína" },
        { tipo: "alergia_mani_mani", nivel: "critica", estado: "pendiente", mensaje: "alergia" },
      ],
    }),
  );
  assert.equal(reporte.nutrientesDeficientesOExcesivos.length, 1);
  assert.equal(reporte.nutrientesDeficientesOExcesivos[0].tipo, "proteina_insuficiente");
  assert.equal(reporte.alertas.length, 2);
});

test("armar: evolucion usa el peso de la última consulta, no el peso actual del paciente", () => {
  const reporte = armar(
    datosBase({
      consultas: [
        { peso: 70, fecha: "2026-01-01" },
        { peso: 66, fecha: "2026-02-01" },
      ],
    }),
  );
  assert.equal(reporte.evolucion.pesoActual, 66);
  assert.equal(reporte.evolucion.pesoInicial, 72);
  assert.equal(reporte.evolucion.deltaPesoKg, -6);
  assert.equal(reporte.evolucion.totalConsultas, 2);
  assert.equal(reporte.paciente.peso, 66);
});

test("armar: sin consultas, usa paciente.peso como peso actual", () => {
  const reporte = armar(datosBase({ consultas: [] }));
  assert.equal(reporte.evolucion.pesoActual, pacienteBase.peso);
  assert.equal(reporte.evolucion.totalConsultas, 0);
});

test("armar: recomendacionesProximaConsulta une motivos de efectividad + alertas pendientes + sugerencias", () => {
  const reporte = armar(
    datosBase({
      efectividad: { indicador: "necesita_ajustes", motivos: ["Cumplimiento de la dieta: 30%"], detalle: {} },
      alertas: [
        { tipo: "sodio_exceso", nivel: "critica", estado: "pendiente", mensaje: "sodio alto" },
        { tipo: "fibra_insuficiente", nivel: "advertencia", estado: "corregida", mensaje: "poca fibra (ya corregida)" },
      ],
      sugerencias: [{ tipo: "calcio_bajo", mensaje: "añadir fuente de calcio" }],
    }),
  );
  assert.deepEqual(reporte.recomendacionesProximaConsulta, [
    "Cumplimiento de la dieta: 30%",
    "sodio alto",
    "añadir fuente de calcio",
  ]);
});

test("armar: la dieta conserva la estructura de días/comidas/detalles", () => {
  const reporte = armar(datosBase());
  assert.equal(reporte.dieta.dias[0].comidas[0].nombrePlato, "Avena con fruta");
  assert.equal(reporte.dieta.dias[0].comidas[0].detalles[0].nombreAlimento, "Avena");
});

test("armar: incluye distribución de macronutrientes calculada del resumen semanal", () => {
  const reporte = armar(datosBase());
  assert.ok(reporte.distribucionMacronutrientes);
  assert.equal(
    reporte.distribucionMacronutrientes.proteinasPorcentaje +
      reporte.distribucionMacronutrientes.carbohidratosPorcentaje +
      reporte.distribucionMacronutrientes.grasasPorcentaje,
    100,
  );
});

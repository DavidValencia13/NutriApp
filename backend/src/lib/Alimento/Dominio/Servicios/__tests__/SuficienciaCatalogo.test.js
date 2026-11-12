const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluarSuficiencia, alertasDeSuficiencia } = require("../SuficienciaCatalogo");
const { evaluar } = require("../EvaluadorCoberturaCatalogo");

const paciente = { peso: 65, altura: 1.65, edad: 26, sexo: "femenino", nivelActividad: "Moderado", objetivo: "Bajar Peso" }; // 1650 kcal, 78 g
const arroz = (kg) => ({
  nombre: "Arroz", cantidad: kg, unidadMedida: "kg", gruposAlimenticios: ["granos_cereales"],
  infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 360, proteinas: 7 },
});

test("calcula calorías y proteínas disponibles por día frente al requerimiento", () => {
  const s = evaluarSuficiencia({ paciente, alimentos: [arroz(2)] }); // 7200 kcal / 7 = 1029 por día
  assert.equal(s.calorias.disponibleDia, 1029);
  assert.equal(s.calorias.requeridoDia, 1650);
  assert.equal(s.calorias.porcentaje, 62);
  assert.ok(s.calorias.faltaSemana > 4000);
  assert.equal(s.proteinas.requeridoDia, 78); // 65 kg × 1.2 (bajar de peso)
});

test("los aceites solo cuentan hasta una porción realista por día", () => {
  const aceite = {
    nombre: "Aceite de oliva", cantidad: 2, unidadMedida: "l",
    infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 884, proteinas: 0 },
  };
  const s = evaluarSuficiencia({ paciente, alimentos: [aceite] });
  assert.equal(s.calorias.disponibleDia, Math.round((884 * 210) / 100 / 7)); // 30 g por día
});

test("avisa qué alimentos por unidad no tienen peso", () => {
  const manzana = { nombre: "Manzana", cantidad: 6, unidadMedida: "unidad", infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 52 } };
  const s = evaluarSuficiencia({ paciente, alimentos: [manzana] });
  assert.deepEqual(s.alimentosSinPeso, ["Manzana"]);
  assert.ok(alertasDeSuficiencia(s).some((a) => a.tipo === "alimentos_sin_peso_por_unidad"));
});

test("alerta crítica bajo 75% y advertencia entre 75% y 95%; nada si alcanza", () => {
  const nivel = (kg) => alertasDeSuficiencia(evaluarSuficiencia({ paciente, alimentos: [arroz(kg)] }))
    .find((a) => a.tipo === "cantidades_insuficientes_calorias")?.nivel;
  assert.equal(nivel(2), "critica"); // 62%
  assert.equal(nivel(2.8), "advertencia"); // 87%
  assert.equal(nivel(4), undefined); // 125%
});

test("la cobertura incluye la suficiencia y un vaso de leche cuenta como fuente de calcio", () => {
  const leche = {
    nombre: "Leche", cantidad: 3, unidadMedida: "l", gruposAlimenticios: ["lacteos"],
    infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 60, proteinas: 3.2, calcio: 113 }, // 250 ml ≈ 282 mg = 22% del valor diario
  };
  const r = evaluar({ paciente, alimentos: [arroz(4), leche] });
  assert.ok(r.suficiencia.calorias.porcentaje > 0);
  assert.equal(r.alertas.some((a) => a.tipo === "sin_fuente_calcio"), false);
});

test("avisa qué vitaminas o minerales faltan y qué alimentos agregar", () => {
  const s = evaluarSuficiencia({ paciente, alimentos: [arroz(4)] }); // arroz: sin vitamina C
  const vitC = s.micronutrientes.find((m) => m.campo === "vitaminaC");
  assert.equal(vitC.suficiente, false);
  const alerta = alertasDeSuficiencia(s).find((a) => a.tipo === "cantidades_insuficientes_vitaminaC");
  assert.match(alerta.mensaje, /naranja/);
});

test("sin cantidades registradas no evalúa vitaminas ni minerales", () => {
  const sinCantidad = { nombre: "Arroz", unidadMedida: "g", infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 360 } };
  assert.deepEqual(evaluarSuficiencia({ paciente, alimentos: [sinCantidad] }).micronutrientes, []);
});

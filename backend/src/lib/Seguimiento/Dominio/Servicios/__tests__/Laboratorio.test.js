const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizarLaboratorio, evaluarLaboratorio } = require("../Laboratorio");
const { evaluarMusculo } = require("../ComposicionCorporal");
const { ValidationError } = require("../../Errores");

test("laboratorio: opcional, acepta coma decimal y rechaza valores imposibles", () => {
  assert.equal(normalizarLaboratorio(null), null);
  assert.equal(normalizarLaboratorio({ glucosa: "" }), null);
  assert.deepEqual(normalizarLaboratorio({ glucosa: "105", hba1c: "5,9", trigliceridos: 180 }), { glucosa: 105, hba1c: 5.9, trigliceridos: 180 });
  assert.throws(() => normalizarLaboratorio({ glucosa: 5000 }), ValidationError);
  assert.throws(() => normalizarLaboratorio("alto"), ValidationError);
});

test("laboratorio: cada valor con su estado según los rangos de referencia", () => {
  const e = evaluarLaboratorio({ glucosa: 110, hba1c: 6.8, colesterolTotal: 185, ldl: 165, hdl: 45, trigliceridos: 155, hemoglobina: 11.2, plaquetas: 250 }, "femenino");
  assert.equal(e.glucosa, "limite"); // prediabetes 100–125
  assert.equal(e.hba1c, "alto"); // ≥ 6,5
  assert.equal(e.colesterolTotal, "normal");
  assert.equal(e.ldl, "alto");
  assert.equal(e.hdl, "bajo"); // mujer < 50
  assert.equal(e.trigliceridos, "limite");
  assert.equal(e.hemoglobina, "bajo"); // anemia en mujer < 12
  assert.equal(e.plaquetas, "normal");
  assert.equal(evaluarLaboratorio({ hdl: 45 }, "masculino").hdl, "normal");
});

test("músculo: bajo / bueno / alto (bioimpedancia o FFMI)", () => {
  assert.equal(evaluarMusculo({ masaMuscularKg: 17.5, peso: 64, sexo: "femenino" }).nivel, "bueno"); // 27,3 %
  assert.equal(evaluarMusculo({ masaMuscularKg: 14, peso: 64, sexo: "femenino" }).nivel, "bajo");
  // fisicoculturista: IMC en "sobrepeso" pero mucha masa magra
  const atleta = evaluarMusculo({ masaMagraKg: 75, altura: 1.75, sexo: "masculino" });
  assert.equal(atleta.nivel, "alto");
  assert.equal(atleta.indicador, "ffmi");
  assert.equal(evaluarMusculo({ peso: 70, sexo: "masculino" }), null);
});

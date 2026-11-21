const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizarMedidas, calcularComposicion, conComposicion, grasaPorPliegues } = require("../ComposicionCorporal");
const RegistroSeguimiento = require("../../Entidades/RegistroSeguimiento");
const { ValidationError } = require("../../Errores");

const MUJER = { edad: 32, sexo: "femenino", altura: 1.6 };

test("todas las medidas son opcionales; vacías = null", () => {
  assert.equal(normalizarMedidas(undefined), null);
  assert.equal(normalizarMedidas({}), null);
  assert.equal(normalizarMedidas({ cintura: "", pliegues: {} }), null);
  assert.deepEqual(normalizarMedidas({ cintura: "84,5" }), {
    cintura: 84.5, cadera: null, brazo: null, grasaPorcentaje: null, masaMuscularKg: null, pliegues: null,
  });
});

test("valida rangos y exige los 4 pliegues juntos", () => {
  assert.throws(() => normalizarMedidas({ cintura: 500 }), ValidationError);
  assert.throws(() => normalizarMedidas({ grasaPorcentaje: -3 }), ValidationError);
  assert.throws(() => normalizarMedidas({ pliegues: { triceps: 20, biceps: 10 } }), /los 4/);
});

test("pliegues: Durnin-Womersley + Siri según sexo y edad", () => {
  // Mujer 30-39, suma 70 mm: D = 1.1423 − 0.0632·log10(70) ≈ 1.0257 → ≈ 32.6 %
  const g = grasaPorPliegues({ triceps: 20, biceps: 10, subescapular: 18, suprailiaco: 22 }, "femenino", 32);
  assert.ok(Math.abs(g - 32.6) < 0.3, `obtenido ${g}`);
  assert.equal(grasaPorPliegues({ triceps: 20, biceps: 10, subescapular: 18, suprailiaco: 22 }, "otro", 32), null);
});

test("composición: kg de grasa, masa magra, IMC, ICC y semáforos", () => {
  const c = calcularComposicion({ grasaPorcentaje: 30, masaMuscularKg: 24, cintura: 82, cadera: 100 }, 64, MUJER);
  assert.equal(c.metodoGrasa, "bioimpedancia");
  assert.equal(c.masaGrasaKg, 19.2);
  assert.equal(c.masaMagraKg, 44.8);
  assert.equal(c.imc, 25);
  assert.equal(c.indiceCinturaCadera, 0.82);
  const { musculo, ...semaforos } = c.evaluacion;
  assert.deepEqual(semaforos, { grasa: "saludable", cintura: "aumentado", indiceCinturaCadera: "saludable", imc: "sobrepeso" });
  assert.ok(musculo === null || ["bajo", "bueno", "alto"].includes(musculo.nivel));
  assert.deepEqual(c.rangoGrasa, { desde: 21, hasta: 33, alto: 39 });
});

test("pliegues sin sexo en la ficha: se avisa en vez de inventar", () => {
  const medidas = normalizarMedidas({ pliegues: { triceps: 20, biceps: 10, subescapular: 18, suprailiaco: 22 } });
  const c = calcularComposicion(medidas, 64, { edad: 32 });
  assert.equal(c.porcentajeGrasa, null);
  assert.equal(c.faltaSexoOEdad, true);
});

test("el registro guarda las medidas y la lista agrega la composición solo donde hay medidas", () => {
  const con = new RegistroSeguimiento({ idPaciente: 1, peso: 64, nivelCumplimiento: "bien", medidas: { cintura: 80 } });
  const sin = new RegistroSeguimiento({ idPaciente: 1, peso: 63, nivelCumplimiento: "bien" });
  assert.equal(con.medidas.cintura, 80);
  assert.equal(sin.medidas, null);
  const [a, b] = conComposicion([con, sin], MUJER);
  assert.equal(a.composicion.cintura, 80);
  assert.equal(b.composicion, undefined);
});

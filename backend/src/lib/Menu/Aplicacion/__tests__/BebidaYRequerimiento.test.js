const test = require("node:test");
const assert = require("node:assert/strict");

const { AsignarBebidaComida, normalizarBebida } = require("../AsignarBebidaComida");
const { detalleRequerimiento, requerimientoCalorico } = require("../../Dominio/Servicios/RequerimientoCalorico");
const { proteinaPorKg } = require("../../../Alimento/Dominio/Servicios/SuficienciaCatalogo");
const { NotFoundError, ValidationError } = require("../../Dominio/Errores");

test("bebida: se limpia, vacía = sin bebida, con tope de largo", () => {
  assert.equal(normalizarBebida("  Agua   aromática de manzanilla "), "Agua aromática de manzanilla");
  assert.equal(normalizarBebida("   "), null);
  assert.equal(normalizarBebida(null), null);
  assert.throws(() => normalizarBebida(5), ValidationError);
  assert.throws(() => normalizarBebida("x".repeat(161)), ValidationError);
});

test("bebida: solo el nutricionista dueño la asigna", async () => {
  const guardadas = [];
  const repo = (dueno) => ({
    async obtenerComidaConPropietario(id) { return dueno ? { id } : null; },
    async guardarBebida(id, b) { guardadas.push([id, b]); },
  });
  const r = await new AsignarBebidaComida({ menuRepository: repo(true) }).ejecutar(11, 1, "Vaso de agua (250 ml)");
  assert.deepEqual(r, { idComidaMenu: 11, bebida: "Vaso de agua (250 ml)" });
  assert.deepEqual(guardadas, [[11, "Vaso de agua (250 ml)"]]);
  await assert.rejects(() => new AsignarBebidaComida({ menuRepository: repo(false) }).ejecutar(11, 9, "Jugo"), NotFoundError);
});

test("requerimiento: muestra fórmula, pasos y macros que suman la meta", () => {
  const paciente = { peso: 64, altura: 1.6, edad: 32, sexo: "femenino", nivelActividad: "Moderado", objetivo: "Aumentar masa muscular" };
  const d = detalleRequerimiento(paciente, { proteinaPorKg });
  assert.equal(d.formula, "Mifflin-St Jeor (1990)");
  assert.equal(d.tmb, 1319); // 640 + 1000 − 160 − 161
  assert.equal(d.factorActividad, 1.55);
  assert.equal(d.ajusteObjetivo, 500);
  assert.equal(d.meta, requerimientoCalorico(paciente));
  const { proteinas, carbohidratos, grasas } = d.macronutrientes;
  assert.equal(proteinas.gramos, 115); // 1,8 g/kg
  assert.equal(proteinas.kcal, 460);
  assert.equal(grasas.porcentaje, 30);
  const suma = proteinas.kcal + carbohidratos.kcal + grasas.kcal;
  assert.ok(Math.abs(suma - d.meta) <= 10, `suma ${suma} vs meta ${d.meta}`);
  assert.equal(detalleRequerimiento({ peso: 0, altura: 1.6 }), null);
  assert.equal(detalleRequerimiento({ peso: 64, altura: 1.6 }).valores.sexoSupuesto, true);
});

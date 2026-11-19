const test = require("node:test");
const assert = require("node:assert/strict");

const { AsignarBebidaComida, normalizarBebida, nutricionDeBebida } = require("../AsignarBebidaComida");
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
    async guardarBebida(id, b, n) { guardadas.push(n ? [id, b, n] : [id, b]); },
  });
  const r = await new AsignarBebidaComida({ menuRepository: repo(true) }).ejecutar(11, 1, { bebida: "Vaso de agua (250 ml)" });
  assert.deepEqual(r, { idComidaMenu: 11, bebida: "Vaso de agua (250 ml)", bebidaNutricion: null });
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

test("bebida con calorías: nutrientes de la porción con la tabla (por 100 ml)", async () => {
  const jugo = { calorias: 45, proteinas: 0.7, carbohidratos: 10.4, grasasTotales: 0.2, vitaminaC: 50 };
  const n = nutricionDeBebida({ ml: 200, por100: jugo, fuente: "USDA", referencia: "Orange juice, raw" });
  assert.equal(n.ml, 200);
  assert.equal(n.nutrientes.calorias, 90);
  assert.equal(n.nutrientes.carbohidratos, 20.8);
  assert.equal(n.nutrientes.vitaminaC, 100);
  assert.equal(n.fuente, "USDA");
  assert.equal(nutricionDeBebida({}), null); // agua o infusión: sin nutrientes
  assert.throws(() => nutricionDeBebida({ ml: 5000, por100: jugo }), ValidationError);

  const guardadas = [];
  const repo = {
    async obtenerComidaConPropietario(id) { return { id }; },
    async guardarBebida(id, b, nut) { guardadas.push({ id, b, nut }); },
  };
  const r = await new AsignarBebidaComida({ menuRepository: repo }).ejecutar(12, 1, { bebida: "Jugo de naranja natural", ml: 200, por100: jugo, fuente: "USDA" });
  assert.equal(r.bebidaNutricion.nutrientes.calorias, 90);
  assert.equal(guardadas[0].nut.nutrientes.calorias, 90);
});

test("bebida preparada: suma los ingredientes elegidos (leche + plátano + Splenda)", () => {
  const leche = { calorias: 61, proteinas: 3.2, carbohidratos: 4.8, grasasTotales: 3.3 };
  const platano = { calorias: 89, proteinas: 1.1, carbohidratos: 22.8, grasasTotales: 0.3 };
  const n = nutricionDeBebida({
    ml: 300,
    ingredientes: [
      { nombre: "Leche entera", cantidad: 240, unidad: "ml", medida: "1 taza", por100: leche, fuente: "USDA" },
      { nombre: "Plátano", cantidad: 120, unidad: "g", por100: platano },
      { nombre: "Splenda", cantidad: 1, unidad: "g", sinCalorias: true },
    ],
  });
  assert.equal(n.ml, 300);
  assert.equal(n.nutrientes.calorias, Math.round(61 * 2.4 + 89 * 1.2)); // 253
  assert.equal(n.ingredientes.length, 3);
  assert.equal(n.ingredientes[0].medida, "1 taza");
  assert.equal(n.ingredientes[2].calorias, 0);
  assert.equal(n.fuente, "USDA");
  assert.throws(() => nutricionDeBebida({ ml: 300, ingredientes: [{ nombre: "Panela", cantidad: 10 }] }), ValidationError);
});

test("proteína: el nutricionista puede fijar g/kg (ej. 1,6) dentro de un rango seguro", () => {
  const { normalizarProteinaPorKg, proteinaDiariaG } = require("../../Dominio/Servicios/RequerimientoCalorico");
  const paciente = { peso: 80, altura: 1.75, edad: 28, sexo: "masculino", nivelActividad: "Alto", objetivo: "Mantener peso" };
  assert.equal(detalleRequerimiento(paciente).proteina.porKg, 1);
  const d = detalleRequerimiento({ ...paciente, proteinaPorKg: 1.6 });
  assert.equal(d.macronutrientes.proteinas.gramos, 128);
  assert.equal(d.proteina.personalizada, true);
  assert.equal(d.proteina.sugeridaPorKg, 1);
  assert.equal(proteinaDiariaG({ ...paciente, proteinaPorKg: 1.6 }), 128);
  assert.equal(normalizarProteinaPorKg("1,64"), 1.6);
  assert.equal(normalizarProteinaPorKg(""), null);
  assert.equal(normalizarProteinaPorKg(5), undefined);
});

test("preparación: se rehace si se agrega una bebida preparada", () => {
  const { necesitaPreparacion, conBebida } = require("../../Dominio/Servicios/Preparacion");
  const pasos = [{ accion: "servir", texto: "Sirve", minutos: 0 }];
  const agua = { bebida: "Vaso de agua", bebidaNutricion: null, preparacion: { pasos } };
  assert.equal(necesitaPreparacion(agua), false);
  const batido = { bebida: "Batido de plátano", bebidaNutricion: { nutrientes: { calorias: 200 } }, preparacion: { pasos } };
  assert.equal(necesitaPreparacion(batido), true);
  assert.equal(necesitaPreparacion({ ...batido, preparacion: conBebida({ pasos }, batido) }), false);
});

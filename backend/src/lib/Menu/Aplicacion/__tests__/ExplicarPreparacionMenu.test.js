const test = require("node:test");
const assert = require("node:assert/strict");

const ExplicarPreparacionMenu = require("../ExplicarPreparacionMenu");
const GeneradorPreparacionIA = require("../../Infraestructura/GeneradorPreparacionIA");
const { normalizarPreparacion } = require("../../Dominio/Servicios/Preparacion");
const { NotFoundError, ValidationError, ServicioExternoError } = require("../../Dominio/Errores");
const { IATimeoutError } = require("../../../../Infraestructura/ia/errores");

function menuDePrueba() {
  return {
    id: 7,
    dias: [
      {
        numeroDia: 1,
        comidas: [
          { id: 11, tipoComida: "Desayuno", nombrePlato: "Colada de avena", detalles: [
            { nombreAlimento: "Avena", unidadMedida: "kg", cantidadUtilizada: "0.04" },
            { nombreAlimento: "Leche", unidadMedida: "l", cantidadUtilizada: "0.25" },
          ] },
          { id: 12, tipoComida: "Almuerzo", nombrePlato: "Seco de pollo", detalles: [],
            preparacion: { pasos: [{ accion: "cocinar", texto: "Ya guardado", minutos: 20 }], minutosTotales: 20 } },
        ],
      },
    ],
  };
}

function repoFalso({ propietario = true } = {}) {
  const guardadas = [];
  return {
    guardadas,
    async obtenerMenuConPropietario() { return propietario ? { id: 7 } : null; },
    async obtenerConDetallesPorId() { return menuDePrueba(); },
    async obtenerComidaConPropietario(id) { return propietario ? { id, menu: { id: 7 } } : null; },
    async guardarPreparaciones(p) { guardadas.push(p); },
  };
}

test("normaliza los pasos: acción conocida, minutos enteros y total", () => {
  const p = normalizarPreparacion({ pasos: [
    { accion: "Freír", texto: "  Fríe el huevo  ", minutos: "4.6" },
    { accion: "bailar", texto: "Sirve", minutos: -3 },
    { accion: "picar", texto: "   " },
  ] });
  assert.deepEqual(p.pasos, [
    { accion: "freir", texto: "Fríe el huevo", minutos: 5 },
    { accion: "cocinar", texto: "Sirve", minutos: 0 },
  ]);
  assert.equal(p.minutosTotales, 5);
  assert.equal(normalizarPreparacion(null), null);
  assert.equal(normalizarPreparacion({ pasos: [] }), null);
  assert.throws(() => normalizarPreparacion({ pasos: "x" }), ValidationError);
  assert.throws(() => normalizarPreparacion({ pasos: Array(9).fill({ texto: "a" }) }), ValidationError);
});

test("genera solo las que faltan, en una sola llamada, y las guarda", async () => {
  const repo = repoFalso();
  let pedidas;
  const caso = new ExplicarPreparacionMenu({
    menuRepository: repo,
    generadorPreparacion: { async generar(comidas) {
      pedidas = comidas.map((c) => c.id);
      return { 11: [{ accion: "hervir", texto: "Hierve la leche", minutos: 5 }] };
    } },
  });
  const r = await caso.generar(7, 1);
  assert.deepEqual(pedidas, [11]);
  assert.equal(r.generadas, 1);
  assert.equal(r.preparaciones[11].pasos[0].texto, "Hierve la leche");
  assert.equal(r.preparaciones[12].pasos[0].texto, "Ya guardado"); // se conserva
  assert.deepEqual(Object.keys(repo.guardadas[0]), ["11"]);
});

test("regenerar vuelve a pedir todas; un plato mal formado no tumba a los demás", async () => {
  const repo = repoFalso();
  let pedidas;
  const caso = new ExplicarPreparacionMenu({
    menuRepository: repo,
    generadorPreparacion: { async generar(comidas) {
      pedidas = comidas.map((c) => c.id);
      return { 11: "basura", 12: [{ accion: "cocinar", texto: "Cocina el pollo", minutos: 25 }] };
    } },
  });
  const r = await caso.generar(7, 1, { regenerar: true });
  assert.deepEqual(pedidas, [11, 12]);
  assert.equal(r.generadas, 1);
  assert.equal(r.preparaciones[11], undefined);
  assert.equal(r.preparaciones[12].pasos[0].texto, "Cocina el pollo");
});

test("si todas ya tienen explicación no llama a la IA", async () => {
  const repo = repoFalso();
  repo.obtenerConDetallesPorId = async () => {
    const m = menuDePrueba();
    m.dias[0].comidas.pop();
    m.dias[0].comidas[0].preparacion = { pasos: [{ accion: "servir", texto: "Sirve", minutos: 0 }], minutosTotales: 0 };
    return m;
  };
  const caso = new ExplicarPreparacionMenu({
    menuRepository: repo,
    generadorPreparacion: { async generar() { throw new Error("no debía llamarse"); } },
  });
  const r = await caso.generar(7, 1);
  assert.equal(r.generadas, 0);
  assert.equal(repo.guardadas.length, 0);
});

test("solo el nutricionista dueño puede generar o editar", async () => {
  const caso = new ExplicarPreparacionMenu({ menuRepository: repoFalso({ propietario: false }), generadorPreparacion: {} });
  await assert.rejects(() => caso.generar(7, 99), NotFoundError);
  await assert.rejects(() => caso.editar(11, 99, { pasos: [{ texto: "x" }] }), NotFoundError);
});

test("el nutricionista corrige o quita la explicación de un plato", async () => {
  const repo = repoFalso();
  const caso = new ExplicarPreparacionMenu({ menuRepository: repo, generadorPreparacion: {} });
  const r = await caso.editar(11, 1, { pasos: [{ accion: "licuar", texto: "Licúa todo", minutos: 2 }] });
  assert.equal(r.preparacion.pasos[0].accion, "licuar");
  const quitada = await caso.editar(11, 1, null);
  assert.equal(quitada.preparacion, null);
  assert.deepEqual(repo.guardadas[1], { 11: null });
});

test("el generador manda ingredientes legibles y lee la respuesta por id", async () => {
  let enviado, opciones;
  const gen = new GeneradorPreparacionIA(async (mensajes, op) => {
    enviado = mensajes[1].content;
    opciones = op;
    return JSON.stringify({ comidas: [{ id: 11, pasos: [{ accion: "hervir", texto: "Hierve", minutos: 5 }] }] });
  });
  const r = await gen.generar([menuDePrueba().dias[0].comidas[0]]);
  assert.match(enviado, /Avena 40 g/);
  assert.match(enviado, /Leche 250 ml/);
  assert.equal(opciones.tarea, "preparacion");
  assert.equal(r[11][0].texto, "Hierve");
});

test("el generador traduce los errores de la IA a mensajes claros", async () => {
  const lento = new GeneradorPreparacionIA(async () => { throw new IATimeoutError("timeout"); });
  await assert.rejects(() => lento.generar([]), (e) => e instanceof ServicioExternoError && e.statusCode === 504);
  const roto = new GeneradorPreparacionIA(async () => "no es json");
  await assert.rejects(() => roto.generar([]), ServicioExternoError);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const DiarioIngesta = require("../Aplicacion/DiarioIngesta");

const idReferencia = "507f1f77bcf86cd799439011";
const referencia = {
  _id: idReferencia,
  nombre: "Banano fresco",
  unidadBase: "g",
  nutrientes: { calorias: 89, proteinas: 1.1, carbohidratos: 22.8, grasasTotales: 0.3 },
};

function crearDiario(fuente = referencia) {
  const registros = [];
  const catalogo = Array.isArray(fuente) ? fuente : [fuente];
  const referenciaModel = {
    find() { return { select() { return { async lean() { return catalogo; } }; } }; },
    findById(id) { return { async lean() { return catalogo.find((item) => String(item._id) === String(id)) || null; } }; },
  };
  const registroRepository = {
    async guardar(datos) { const registro = { id: registros.length + 1, ...datos }; registros.push(registro); return registro; },
    async listar(idPaciente) { return registros.filter((r) => r.idPaciente === idPaciente); },
    async eliminar(idPaciente, id) { const i = registros.findIndex((r) => r.idPaciente === idPaciente && r.id === id); if (i < 0) return false; registros.splice(i, 1); return true; },
  };
  return { diario: new DiarioIngesta({ referenciaModel, registroRepository }), registros };
}

test("busca sugerencias de la tabla ignorando tildes", async () => {
  const { diario } = crearDiario({ ...referencia, nombre: "Plátano fresco" });
  assert.equal((await diario.buscarAlimentos("platano"))[0].nombre, "Plátano fresco");
  assert.deepEqual(await diario.buscarAlimentos("b"), []);
});

test("prioriza alimentos habituales sobre variantes especiales", async () => {
  const { diario } = crearDiario([
    { ...referencia, _id: "507f1f77bcf86cd799439012", nombre: "Leche materna, fluida" },
    { ...referencia, nombre: "Leche de vaca, fluida, entera" },
    { ...referencia, _id: "507f1f77bcf86cd799439013", nombre: "Pollo, hígado, crudo" },
    { ...referencia, _id: "507f1f77bcf86cd799439014", nombre: "Pollo, pechuga, cocida" },
  ]);
  assert.match((await diario.buscarAlimentos("leche"))[0].nombre, /vaca/);
  assert.match((await diario.buscarAlimentos("pollo"))[0].nombre, /pechuga/);
});

test("calcula nutrientes en backend a partir de la referencia y la porción", async () => {
  const { diario } = crearDiario();
  const registro = await diario.registrar(10, { idReferencia, cantidad: 150, fecha: "2026-11-16" });
  assert.equal(registro.nutrientes.calorias, 133.5);
  assert.equal(registro.nutrientes.proteinas, 1.65);
  assert.equal(registro.fuente, "USFQ");
  assert.equal((await diario.listar(10)).length, 1);
});

test("rechaza referencia, cantidad, fecha y calorías ausentes", async () => {
  const { diario } = crearDiario();
  const datos = { idReferencia, cantidad: 100, fecha: "2026-11-16" };
  await assert.rejects(() => diario.registrar(10, { ...datos, idReferencia: "invalido" }), { statusCode: 400 });
  await assert.rejects(() => diario.registrar(10, { ...datos, cantidad: 0 }), { statusCode: 400 });
  await assert.rejects(() => diario.registrar(10, { ...datos, fecha: "2026-02-30" }), { statusCode: 400 });
  const sinCalorias = crearDiario({ ...referencia, nutrientes: { proteinas: 1 } }).diario;
  await assert.rejects(() => sinCalorias.registrar(10, datos), { statusCode: 400 });
});

test("lista y elimina solo registros del paciente propietario", async () => {
  const { diario } = crearDiario();
  const registro = await diario.registrar(10, { idReferencia, cantidad: 100, fecha: "2026-11-16" });
  assert.deepEqual(await diario.listar(11), []);
  await assert.rejects(() => diario.eliminar(11, registro.id), { statusCode: 404 });
  assert.equal((await diario.listar(10)).length, 1);
  await diario.eliminar(10, registro.id);
  assert.deepEqual(await diario.listar(10), []);
});

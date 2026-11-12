const test = require("node:test");
const assert = require("node:assert/strict");

const BuscadorNutricionalUSFQ = require("../BuscadorNutricionalUSFQ");
const { elegirMejorCoincidencia } = BuscadorNutricionalUSFQ;

const TABLA = [
  { nombre: "Harina de arroz blanco", nombreIngles: "Rice flour, white", codigoFuente: 2, unidadBase: "g", nutrientes: { calorias: 366 } },
  { nombre: "Arroz blanco, grano largo crudo", nombreIngles: "Rice, white, long-grain, raw, unenriched", codigoFuente: 2, unidadBase: "g", nutrientes: { calorias: 354.26 } },
  { nombre: "Arroz blanco, grano largo, cocido", nombreIngles: "Rice, white, long-grain, cooked", codigoFuente: 2, unidadBase: "g", nutrientes: { calorias: 125.96 } },
  { nombre: "Chocho, cocido, sin sal", nombreIngles: "Lupine, mature seed, cooked, without salt", codigoFuente: 1, unidadBase: "g", nutrientes: { calorias: 128.08, proteinas: 15.57 } },
  { nombre: "Chocho, snack, tostado, Chochitos", nombreIngles: "Lupine, snack, toasted", codigoFuente: 7, unidadBase: "g", nutrientes: { calorias: 400 } },
  { nombre: "Fréjol, negro, grano seco, crudo", nombreIngles: "Beans, black, mature seeds, raw", codigoFuente: 2, unidadBase: "g", nutrientes: { calorias: 341 } },
  { nombre: "Chicha,de jora, maiz", nombreIngles: "Chicha, yellow corn", codigoFuente: 3, unidadBase: "ml", nutrientes: { calorias: 28 } },
  { nombre: "Leche, de vaca, en polvo, entera", nombreIngles: "Milk, powder, whole", codigoFuente: 1, unidadBase: "g", nutrientes: { calorias: 499.35 } },
  { nombre: "Leche, de vaca, fluida, entera 3.25% grasa", nombreIngles: "Milk, whole, 3.25% milkfat", codigoFuente: 1, unidadBase: "ml", nutrientes: { calorias: 60.21 } },
  { nombre: "Yogurt, natural, entero", nombreIngles: "Yogurt, plain, whole milk", codigoFuente: 1, unidadBase: "g", nutrientes: { calorias: 61 } },
  { nombre: "Carnero, carne, crudo", nombreIngles: "Lamb, meat, raw", codigoFuente: 1, unidadBase: "g", nutrientes: { calorias: 304.95 } },
  { nombre: "Res, carne magra, cruda", nombreIngles: "Beef, lean, raw", codigoFuente: 1, unidadBase: "g", nutrientes: { calorias: 119.62 } },
];

test("prefiere el nombre que empieza con la palabra buscada y el más genérico", () => {
  assert.equal(elegirMejorCoincidencia("arroz blanco", TABLA).nombre, "Arroz blanco, grano largo crudo");
});

test("ignora tildes, mayúsculas y plurales", () => {
  assert.equal(elegirMejorCoincidencia("FREJOLES negros", TABLA).nombre, "Fréjol, negro, grano seco, crudo");
});

test("busca también por el nombre en inglés", () => {
  assert.equal(elegirMejorCoincidencia("lupine", TABLA).nombre, "Chocho, cocido, sin sal");
});

test("deja los productos de marca (etiquetado) después de los genéricos", () => {
  assert.equal(elegirMejorCoincidencia("chocho", TABLA).nombre, "Chocho, cocido, sin sal");
});

test("devuelve null si alguna palabra buscada no está en el nombre", () => {
  assert.equal(elegirMejorCoincidencia("arroz con pollo", TABLA), null);
  assert.equal(elegirMejorCoincidencia("de la", TABLA), null);
});

test("buscar devuelve el formato del puerto con fuente USFQ", async () => {
  const buscador = new BuscadorNutricionalUSFQ(async () => TABLA);
  const r = await buscador.buscar("chocho cocido");
  assert.equal(r.fuente, "USFQ");
  assert.equal(r.nombreEncontrado, "Chocho, cocido, sin sal");
  assert.equal(r.tipoMedicion, "peso");
  assert.equal(r.refCantidad, 100);
  assert.equal(r.proteinas, 15.57);
});

test("los alimentos en 100 ml se marcan como volumen", async () => {
  const buscador = new BuscadorNutricionalUSFQ(async () => TABLA);
  assert.equal((await buscador.buscar("chicha de jora")).tipoMedicion, "volumen");
});

test("si la tabla aún no está cargada devuelve null y vuelve a intentar después", async () => {
  let llamadas = 0;
  const buscador = new BuscadorNutricionalUSFQ(async () => (++llamadas === 1 ? [] : TABLA));
  assert.equal(await buscador.buscar("chocho"), null);
  assert.equal((await buscador.buscar("chocho")).fuente, "USFQ");
  await buscador.buscar("arroz");
  assert.equal(llamadas, 2);
});

test("con una búsqueda general prefiere la forma básica sobre la procesada", () => {
  assert.equal(elegirMejorCoincidencia("leche", TABLA).nombre, "Leche, de vaca, fluida, entera 3.25% grasa");
});

test("si se pide la versión procesada, la encuentra", () => {
  assert.equal(elegirMejorCoincidencia("leche en polvo", TABLA).nombre, "Leche, de vaca, en polvo, entera");
});

test("palabras de 5+ letras coinciden como prefijo (yogur ~ yogurt)", () => {
  assert.equal(elegirMejorCoincidencia("yogur", TABLA).nombre, "Yogurt, natural, entero");
});

test("una coincidencia exacta gana a una por prefijo (carne no es carnero)", () => {
  assert.equal(elegirMejorCoincidencia("carne", TABLA).nombre, "Res, carne magra, cruda");
});

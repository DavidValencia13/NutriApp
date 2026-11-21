const test = require("node:test");
const assert = require("node:assert/strict");
const { actualizarPorCambios, completarNombre, reemplazarAlimento } = require("../NombrePlato");

test("nombre: al cambiar acelga por espinaca se actualiza el nombre y la descripción", () => {
  const antes = ["Garbanzo", "Arroz blanco", "Acelga", "Tomate riñón"];
  const despues = ["Garbanzo", "Arroz blanco", "Espinaca, cruda", "Tomate riñón"];
  assert.equal(
    actualizarPorCambios("Garbanzo guisado con arroz blanco y ensalada de acelga", antes, despues),
    "Garbanzo guisado con arroz blanco y ensalada de espinaca",
  );
  assert.equal(actualizarPorCambios("La acelga se pica y se mezcla con el tomate.", ["Acelga"], ["Espinaca"]),
    "La espinaca se pica y se mezcla con el tomate.");
  assert.equal(reemplazarAlimento("Acelga salteada", "Acelga", "Espinaca"), "Espinaca salteada");
  // sin cambios de alimentos, el texto queda igual
  assert.equal(actualizarPorCambios("Sopa de lentejas", ["Lenteja"], ["Lenteja"]), "Sopa de lentejas");
});

test("nombre: se agregan los alimentos que faltan (sin aceite ni sal)", () => {
  assert.equal(
    completarNombre("Garbanzo guisado con arroz blanco y ensalada de acelga",
      ["Garbanzos cocidos", "Arroz blanco", "Acelga", "Tomate riñón", "Aceite vegetal", "Sal"]),
    "Garbanzo guisado con arroz blanco y ensalada de acelga con tomate riñón",
  );
  assert.equal(completarNombre("Huevos revueltos con pan", ["Huevo", "Pan integral", "Leche entera"]),
    "Huevos revueltos con pan y leche entera");
  // ya los menciona todos (singular/plural, tildes, "pechuga de pollo")
  assert.equal(completarNombre("Pollo a la plancha con arroz", ["Pechuga de pollo", "Arroz blanco"]), "Pollo a la plancha con arroz");
  assert.equal(completarNombre("Avena cocida en leche con plátano en rodajas", ["Avena", "Leche", "Platano"]),
    "Avena cocida en leche con plátano en rodajas");
});

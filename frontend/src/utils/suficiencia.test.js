import test from "node:test";
import assert from "node:assert/strict";
import { catalogoPreparadoParaMenu } from "./suficiencia.js";

const cobertura = {
  listoParaMenu: true,
  suficiencia: {
    calorias: { porcentaje: 100 },
    proteinas: { porcentaje: 98 },
    alimentosSinDatos: [],
    alimentosSinPeso: [],
  },
};

test("el menú espera una cobertura verificada y alimentos registrados", () => {
  assert.equal(catalogoPreparadoParaMenu(null, 2), false);
  assert.equal(catalogoPreparadoParaMenu(cobertura, 0), false);
  assert.equal(catalogoPreparadoParaMenu(cobertura, 2), true);
});

test("el menú espera alimentos compatibles, cantidades y fichas calculables", () => {
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, listoParaMenu: false }, 2), false);
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, suficiencia: { ...cobertura.suficiencia, proteinas: { porcentaje: 90 } } }, 2), false);
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, suficiencia: { ...cobertura.suficiencia, alimentosSinDatos: ["Avena"] } }, 2), false);
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, suficiencia: { ...cobertura.suficiencia, alimentosSinPeso: ["Huevo"] } }, 2), false);
});

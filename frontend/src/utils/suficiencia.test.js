import test from "node:test";
import assert from "node:assert/strict";
import { catalogoPreparadoParaMenu } from "./suficiencia.js";

const cobertura = {
  listoParaMenu: true,
  resumen: { esencialesCubiertos: 6, esencialesTotal: 6 },
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

test("no permite continuar cuando falta un grupo esencial aunque el resto esté listo", () => {
  assert.equal(catalogoPreparadoParaMenu({
    ...cobertura,
    resumen: { esencialesCubiertos: 5, esencialesTotal: 6 },
  }, 11), false);
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, resumen: null }, 11), false);
  assert.equal(catalogoPreparadoParaMenu(cobertura, 11), true);
});

test("no permite continuar con 6/6 si aún recomienda alimentos para completar la variedad", () => {
  assert.equal(catalogoPreparadoParaMenu({
    ...cobertura,
    alertas: [{ tipo: "sin_fuente_calcio", nivel: "advertencia", gruposSugeridos: ["lacteos"] }],
  }, 8), false);
  assert.equal(catalogoPreparadoParaMenu({
    ...cobertura,
    alertas: [{ tipo: "exceso_procesados", grupoSugerido: "verduras_hortalizas" }],
  }, 8), false);
  assert.equal(catalogoPreparadoParaMenu({ ...cobertura, alertas: [] }, 8), true);
});

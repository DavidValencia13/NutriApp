const test = require("node:test");
const assert = require("node:assert/strict");
const ResumenPaciente14Dias = require("../ResumenPaciente14Dias");

test("resume solo registros recientes y menús aprobados; las comidas sin marca no son incumplimiento", async () => {
  const idsConsultados = [];
  const servicio = new ResumenPaciente14Dias({
    ahora: () => new Date("2026-11-17T12:00:00Z"),
    seguimientoRepo: { listarPorPaciente: async () => [
      { fecha: new Date("2026-10-20T00:00:00Z"), peso: 72 }, { fecha: new Date("2026-11-10T00:00:00Z"), peso: 70 },
    ] },
    ingestaRepo: { listar: async () => [
      { fecha: "2026-11-16", nombreAlimento: "Arroz", cantidad: 100, unidad: "g", nutrientes: { calorias: 130 } },
      { fecha: "2026-10-20", nombreAlimento: "Pan", cantidad: 1, unidad: "unidad" },
    ] },
    menuRepo: {
      listarVersionesPorPaciente: async () => [
        { id: 2, estado: "generado", fechaFin: "2026-11-18" },
        { id: 1, estado: "aprobado", fechaInicio: new Date("2026-11-09T00:00:00Z"), fechaFin: new Date("2026-11-15T00:00:00Z") },
        { id: 0, estado: "aprobado", fechaFin: new Date("2026-10-20T00:00:00Z") },
      ],
      obtenerConDetallesPorId: async (id) => {
        idsConsultados.push(id);
        return { fechaInicio: new Date("2026-11-09T00:00:00Z"), fechaFin: new Date("2026-11-15T00:00:00Z"), dias: [{ numeroDia: 1, comidas: [
          { id: 11, tipoComida: "desayuno", nombrePlato: "Avena" },
          { id: 12, tipoComida: "almuerzo", nombrePlato: "Arroz" },
        ] }] };
      },
    },
    marcaRepo: { listarPorComidas: async () => [{ idComidaMenu: 11, estado: "si" }] },
  });
  const resultado = await servicio.ejecutar(3);
  assert.equal(resultado.desde, "2026-11-03");
  assert.deepEqual(idsConsultados, [1]);
  assert.equal(resultado.controles.length, 1);
  assert.equal(resultado.ingestas.length, 1);
  assert.equal(resultado.menus[0].porcentajeMarcado, 100);
  assert.equal(resultado.menus[0].comidasMarcadas, 1);
  assert.equal(resultado.menus[0].comidasTotales, 2);
  assert.equal(resultado.menus[0].fechaInicio, "2026-11-09");
});

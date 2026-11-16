const test = require("node:test");
const assert = require("node:assert/strict");

const CrearPacienteDemo = require("../CrearPacienteDemo");
const { NOMBRE_DEMO, ALIMENTOS_DEMO } = CrearPacienteDemo;

function repos() {
  const pacientes = [];
  const alimentos = [];
  return {
    pacientes,
    alimentos,
    pacienteRepository: {
      async findAllByNutriologo(id) {
        return pacientes.filter((p) => p.idNutriologo === id);
      },
      async save(p) {
        const guardado = { ...p, id: pacientes.length + 1 };
        pacientes.push(guardado);
        return guardado;
      },
    },
    alimentoRepository: {
      async save(a) {
        alimentos.push(a);
        return a;
      },
    },
  };
}

test("crea la paciente de ejemplo con sus alimentos verificados", async () => {
  const r = repos();
  const paciente = await new CrearPacienteDemo(r).ejecutar(7);
  assert.equal(paciente.nombre, NOMBRE_DEMO);
  assert.equal(paciente.idNutriologo, 7);
  assert.equal(r.alimentos.length, ALIMENTOS_DEMO.length);
  assert.ok(r.alimentos.every((a) => a.idPaciente === paciente.id && a.infoNutricional?.calorias > 0));
  assert.ok(r.alimentos.every((a) => ["USDA", "USFQ"].includes(a.infoNutricional.fuente)));
});

test("el catálogo de la demo cabe en su presupuesto (si no, no se puede editar nada)", async () => {
  const r = repos();
  const paciente = await new CrearPacienteDemo(r).ejecutar(7);
  const costo = ALIMENTOS_DEMO.reduce((s, a) => s + a.cantidad * a.precio, 0);
  assert.ok(costo <= paciente.presupuesto, `catálogo $${costo.toFixed(2)} > presupuesto $${paciente.presupuesto}`);
});

test("no la duplica si el nutricionista ya la tiene", async () => {
  const r = repos();
  const caso = new CrearPacienteDemo(r);
  await caso.ejecutar(7);
  assert.equal(await caso.ejecutar(7), null);
  assert.equal(r.pacientes.length, 1);
  assert.ok(await caso.ejecutar(8)); // otro nutricionista sí puede tener la suya
});

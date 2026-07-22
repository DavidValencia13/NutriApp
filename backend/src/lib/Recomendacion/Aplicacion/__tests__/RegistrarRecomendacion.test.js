const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarRecomendacion = require("../RegistrarRecomendacion");

function crearRepoFalso() {
  return {
    creadas: [],
    async crear(recomendacion, opciones) {
      this.creadas.push({ recomendacion, opciones });
      return recomendacion;
    },
  };
}

test("guarda la recomendación construida", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarRecomendacion(repo);

  await caso.ejecutar({ idPaciente: 1, texto: "Comer más fibra", fechaGeneracion: new Date() });

  assert.equal(repo.creadas.length, 1);
  assert.equal(repo.creadas[0].recomendacion.texto, "Comer más fibra");
});

test("funciona sin pasar opciones (contextoPersistencia por defecto)", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarRecomendacion(repo);

  await caso.ejecutar({ idPaciente: 1, texto: "Comer más fibra", fechaGeneracion: new Date() });

  assert.equal(repo.creadas[0].opciones.contextoPersistencia, undefined);
});

test("propaga el contextoPersistencia recibido", async () => {
  const repo = crearRepoFalso();
  const caso = new RegistrarRecomendacion(repo);
  const transaccionFalsa = { id: "tx-1" };

  await caso.ejecutar(
    { idPaciente: 1, texto: "Comer más fibra", fechaGeneracion: new Date() },
    { contextoPersistencia: transaccionFalsa },
  );

  assert.equal(repo.creadas[0].opciones.contextoPersistencia, transaccionFalsa);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const GenerarMenuSemanal = require("../GenerarMenuSemanal");
const { ValidationError, ServicioExternoError } = require("../../Dominio/Errores");

const paciente = { id: 1, idNutriologo: 10, numeroComidas: 1 };
const alimento = { id: "507f1f77bcf86cd799439011", nombre: "Arroz", unidadMedida: "g" };

function comidaCon(idAlimento, calorias = 400) {
  return { orden: 1, tipoComida: "Desayuno", calorias, alimentos: [{ idAlimento, cantidad: 100 }] };
}

function resultadoIAValido() {
  return {
    dias: Array.from({ length: 7 }, (_, i) => ({ numeroDia: i + 1, comidas: [comidaCon(alimento.id)] })),
    recomendacion: "Comer más fibra.",
  };
}

function crearDependencias({ resultadoIA, alimentosDisponibles = [alimento], generadorFalla } = {}) {
  const menuRepository = {
    llamadasCrear: [],
    async ejecutarEnTransaccion(fn) {
      return await fn("tx-falsa");
    },
    async crear(menu, dias, opciones) {
      this.llamadasCrear.push({ menu, dias, opciones });
      return { id: 1, ...menu };
    },
  };

  const registrarRecomendacion = {
    llamadas: [],
    async ejecutar(data, opciones) {
      this.llamadas.push({ data, opciones });
    },
  };

  const generadorMenuIA = {
    llamadas: [],
    async generar(args) {
      this.llamadas.push(args);
      if (generadorFalla) throw new ServicioExternoError("falla simulada");
      return resultadoIA || resultadoIAValido();
    },
  };

  return {
    pacienteRepository: { async findById() { return paciente; } },
    listarAlimentosPorPaciente: { async ejecutar() { return alimentosDisponibles; } },
    generadorMenuIA,
    menuRepository,
    registrarRecomendacion,
  };
}

test("lanza error si el paciente no existe", async () => {
  const deps = crearDependencias();
  deps.pacienteRepository = { async findById() { return null; } };
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10));
});

test("lanza ValidationError si el paciente no tiene alimentos", async () => {
  const deps = crearDependencias({ alimentosDisponibles: [] });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ValidationError);
});

test("propaga el error del generador de IA sin persistir nada", async () => {
  const deps = crearDependencias({ generadorFalla: true });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ServicioExternoError);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("un idAlimento inventado por la IA lanza ServicioExternoError (502), no ValidationError", async () => {
  const resultadoIA = resultadoIAValido();
  resultadoIA.dias[0].comidas[0].alimentos[0].idAlimento = "000000000000000000000000"; // no está en la lista
  const deps = crearDependencias({ resultadoIA });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ServicioExternoError);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("el perfil enviado a la IA no incluye id/idNutriologo/nombre del paciente", async () => {
  const deps = crearDependencias();
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  const perfilEnviado = deps.generadorMenuIA.llamadas[0].perfilPaciente;
  assert.equal(perfilEnviado.id, undefined);
  assert.equal(perfilEnviado.idNutriologo, undefined);
  assert.equal(perfilEnviado.nombre, undefined);
});

test("caloriasTotales del día es la suma de sus comidas, aunque la IA devuelva otro valor", async () => {
  const resultadoIA = resultadoIAValido();
  resultadoIA.dias[0].caloriasTotales = 99999; // la IA no debería poder mandar esto, pero si lo hace, se ignora
  const deps = crearDependencias({ resultadoIA });
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  const diaPersistido = deps.menuRepository.llamadasCrear[0].dias[0];
  assert.equal(diaPersistido.caloriasTotales, 400); // 1 comida de 400 calorías, numeroComidas: 1
});

test("caso feliz: guarda menú y recomendación en la misma transacción, con snapshot correcto", async () => {
  const deps = crearDependencias();
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  assert.equal(deps.menuRepository.llamadasCrear.length, 1);
  assert.equal(deps.registrarRecomendacion.llamadas.length, 1);
  assert.equal(deps.registrarRecomendacion.llamadas[0].opciones.contextoPersistencia, "tx-falsa");

  const detalle = deps.menuRepository.llamadasCrear[0].dias[0].comidas[0].alimentos[0];
  assert.equal(detalle.nombreAlimento, "Arroz");
  assert.equal(detalle.unidadMedida, "g");
});

test("ignora el nombre/unidad que la IA intente colar (usa siempre el snapshot del repositorio de alimentos)", async () => {
  const resultadoIA = resultadoIAValido();
  resultadoIA.dias[0].comidas[0].alimentos[0].nombre = "Alimento inventado por la IA";
  const deps = crearDependencias({ resultadoIA });
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  const detalle = deps.menuRepository.llamadasCrear[0].dias[0].comidas[0].alimentos[0];
  assert.equal(detalle.nombreAlimento, "Arroz");
});

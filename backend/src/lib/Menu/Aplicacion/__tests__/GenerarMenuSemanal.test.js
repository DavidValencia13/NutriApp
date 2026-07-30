const test = require("node:test");
const assert = require("node:assert/strict");

const GenerarMenuSemanal = require("../GenerarMenuSemanal");
const { ValidationError, ServicioExternoError } = require("../../Dominio/Errores");

const paciente = { id: 1, idNutriologo: 10, numeroComidas: 1 };
const alimento = {
  id: "507f1f77bcf86cd799439011",
  nombre: "Arroz",
  cantidad: 1000,
  unidadMedida: "g",
};

function comidaCon(indiceAlimento, calorias = 400) {
  return { orden: 1, tipoComida: "Desayuno", calorias, alimentos: [{ indiceAlimento, cantidad: 100 }] };
}

function resultadoIAValido() {
  return {
    dias: Array.from({ length: 7 }, (_, i) => ({ numeroDia: i + 1, comidas: [comidaCon(1)] })), // índice 1 = único alimento disponible por defecto
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

test("un indiceAlimento fuera de rango lanza ServicioExternoError (502), no ValidationError", async () => {
  const resultadoIA = resultadoIAValido();
  resultadoIA.dias[0].comidas[0].alimentos[0].indiceAlimento = 99; // no existe esa posición en la lista
  const deps = crearDependencias({ resultadoIA });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ServicioExternoError);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("una cantidad fuera de escala para la unidad del alimento (ej. 150 kg) lanza ServicioExternoError sin persistir nada", async () => {
  const alimentoEnKg = { id: alimento.id, nombre: "Pollo", cantidad: 2, unidadMedida: "kg" };
  const resultadoIA = resultadoIAValido();
  resultadoIA.dias[0].comidas[0].alimentos[0].cantidad = 150; // debería ser una fracción, ej. 0.15
  const deps = crearDependencias({ resultadoIA, alimentosDisponibles: [alimentoEnKg] });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ServicioExternoError);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("no llama a la IA si el costo del catálogo ya supera el presupuesto", async () => {
  const alimentoCaro = { ...alimento, nombre: "Carne premium", precio: 5 };
  const pacienteConPresupuesto = { ...paciente, presupuesto: 10 };
  const deps = crearDependencias({ alimentosDisponibles: [alimentoCaro] });
  deps.pacienteRepository = { async findById() { return pacienteConPresupuesto; } };
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ValidationError);
  assert.equal(deps.generadorMenuIA.llamadas.length, 0);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("un menú dentro del margen del 15% sobre presupuesto sí se persiste", async () => {
  const alimentoAjustado = { ...alimento, cantidad: 700, precio: 0.01 }; // 100g * 0.01 = 1$/día = 7$/semana
  const pacienteConPresupuesto = { ...paciente, presupuesto: 7 };
  const deps = crearDependencias({ alimentosDisponibles: [alimentoAjustado] });
  deps.pacienteRepository = { async findById() { return pacienteConPresupuesto; } };
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);
  assert.equal(deps.menuRepository.llamadasCrear.length, 1);
});

test("rechaza un menú que usa más cantidad que la registrada", async () => {
  const deps = crearDependencias({
    alimentosDisponibles: [{ ...alimento, cantidad: 600 }],
  });
  const caso = new GenerarMenuSemanal(deps);

  await assert.rejects(
    () => caso.ejecutar(1, 10),
    (error) =>
      error instanceof ServicioExternoError &&
      error.message.includes("solo hay 600 g registradas") &&
      error.message.includes("Faltan 100.00 g"),
  );
  assert.equal(deps.generadorMenuIA.llamadas.length, 3);
  assert.match(
    deps.generadorMenuIA.llamadas[1].correccionAnterior,
    /solo hay 600 g registradas/,
  );
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

test("caso feliz: guarda el menú con snapshot correcto", async () => {
  const deps = crearDependencias();
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  assert.equal(deps.menuRepository.llamadasCrear.length, 1);
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

test("nutrientes queda incompleto cuando el alimento no tiene infoNutricional", async () => {
  const deps = crearDependencias(); // fixture "alimento" no tiene infoNutricional
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  const dia = deps.menuRepository.llamadasCrear[0].dias[0];
  const comida = dia.comidas[0];
  const detalle = comida.alimentos[0];
  assert.equal(detalle.nutrientes.completo, false);
  assert.equal(comida.nutrientes.completo, false);
  assert.equal(dia.nutrientes.completo, false);
});

test("calcula nutrientes reales a partir de infoNutricional del alimento", async () => {
  const alimentoConInfo = {
    id: alimento.id,
    nombre: "Arroz",
    cantidad: 1000,
    unidadMedida: "g",
    infoNutricional: { refCantidad: 100, refUnidad: "g", calorias: 130, proteinas: 2.7 },
  };
  const deps = crearDependencias({ alimentosDisponibles: [alimentoConInfo] });
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  // cantidad usada: 100g (ver comidaCon) => mismo factor que la referencia (100g)
  const detalle = deps.menuRepository.llamadasCrear[0].dias[0].comidas[0].alimentos[0];
  assert.equal(detalle.nutrientes.nutrientes.calorias, 130);
  assert.equal(detalle.nutrientes.nutrientes.proteinas, 2.7);
});

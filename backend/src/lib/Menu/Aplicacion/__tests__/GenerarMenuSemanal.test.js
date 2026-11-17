const test = require("node:test");
const assert = require("node:assert/strict");

const GenerarMenuSemanal = require("../GenerarMenuSemanal");
const { ValidationError, ConflictError, ServicioExternoError } = require("../../Dominio/Errores");

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

function crearDependencias({ resultadoIA, alimentosDisponibles = [alimento], generadorFalla, versionAnterior = null, versionDurantePersistencia = versionAnterior, cobertura = { listoParaMenu: true, resumen: { esencialesCubiertos: 6, esencialesTotal: 6 }, alertas: [] } } = {}) {
  const menuRepository = {
    llamadasCrear: [],
    consultasVersion: 0,
    async obtenerUltimaVersionResumen() {
      this.consultasVersion++;
      return this.consultasVersion === 1 ? versionAnterior : versionDurantePersistencia;
    },
    async bloquearPaciente() {},
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
    evaluarCobertura: () => cobertura,
    generadorMenuIA,
    menuRepository,
    registrarRecomendacion,
  };
}

test("un menú previo exige confirmación antes de llamar a la IA", async () => {
  const deps = crearDependencias({ versionAnterior: { id: 8, estado: "aprobado" } });
  await assert.rejects(() => new GenerarMenuSemanal(deps).ejecutar(1, 10), ConflictError);
  assert.equal(deps.generadorMenuIA.llamadas.length, 0);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

test("con confirmación crea una propuesta y conserva la versión anterior", async () => {
  const anterior = { id: 8, estado: "aprobado" };
  const deps = crearDependencias({ versionAnterior: anterior });
  await new GenerarMenuSemanal(deps).ejecutar(1, 10, { confirmarNuevaVersion: true, idVersionActual: 8 });
  assert.equal(deps.menuRepository.llamadasCrear.length, 1);
  assert.equal(deps.menuRepository.llamadasCrear[0].menu.estado, "generado");
  assert.equal(anterior.estado, "aprobado");
});

test("la propuesta recibe el contexto reciente del paciente", async () => {
  const deps = crearDependencias();
  deps.resumenPaciente14Dias = { ejecutar: async () => ({ desde: "2026-11-03", controles: [{ peso: 68 }], menus: [], ingestas: [] }) };
  await new GenerarMenuSemanal(deps).ejecutar(1, 10);
  assert.equal(deps.generadorMenuIA.llamadas[0].perfilPaciente.resumenUltimos14Dias.desde, "2026-11-03");
});

test("rechaza una confirmación hecha sobre una versión ya reemplazada", async () => {
  const deps = crearDependencias({ versionAnterior: { id: 9, estado: "generado" } });
  await assert.rejects(() => new GenerarMenuSemanal(deps).ejecutar(1, 10, {
    confirmarNuevaVersion: true,
    idVersionActual: 8,
  }), ConflictError);
  assert.equal(deps.generadorMenuIA.llamadas.length, 0);
});

test("si apareció otra versión durante la generación evita persistir una propuesta obsoleta", async () => {
  const deps = crearDependencias({ versionAnterior: { id: 8 }, versionDurantePersistencia: { id: 9 } });
  await assert.rejects(() => new GenerarMenuSemanal(deps).ejecutar(1, 10, { confirmarNuevaVersion: true, idVersionActual: 8 }), ConflictError);
  assert.equal(deps.menuRepository.llamadasCrear.length, 0);
});

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

test("no llama a la IA si faltan grupos o recomendaciones de alimentos", async () => {
  for (const cobertura of [
    { listoParaMenu: true, resumen: { esencialesCubiertos: 5, esencialesTotal: 6 }, alertas: [] },
    { listoParaMenu: true, resumen: { esencialesCubiertos: 6, esencialesTotal: 6 }, alertas: [
      { tipo: "sin_fuente_calcio", gruposSugeridos: ["lacteos"] },
    ] },
  ]) {
    const deps = crearDependencias({ cobertura });
    await assert.rejects(() => new GenerarMenuSemanal(deps).ejecutar(1, 10), ValidationError);
    assert.equal(deps.generadorMenuIA.llamadas.length, 0);
  }
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

test("si el menú se pasa del inventario, reduce las porciones en proporción sin pedir otro menú", async () => {
  // 7 días × 100 g = 700 g usados, pero solo hay 600 g
  const deps = crearDependencias({
    alimentosDisponibles: [{ ...alimento, cantidad: 600 }],
  });
  const caso = new GenerarMenuSemanal(deps);
  await caso.ejecutar(1, 10);

  assert.equal(deps.generadorMenuIA.llamadas.length, 1);
  const dias = deps.menuRepository.llamadasCrear[0].dias;
  const porciones = dias.map((d) => d.comidas[0].alimentos[0].cantidadUtilizada);
  assert.deepEqual(porciones, Array(7).fill(85)); // 100 × 600/700 = 85.7 -> 85 g (hacia abajo)
  assert.ok(porciones.reduce((s, c) => s + c, 0) <= 600);
});

test("el ajuste reduce unidades fraccionarias en proporción; si una porción quedaría en 0 pide otro menú", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const yogur = { id: "y", nombre: "Yogur", cantidad: 3, unidadMedida: "unidad" };
  const pan = { id: "p", nombre: "Pan", cantidad: 10, unidadMedida: "unidad" };
  const menu = (cantidadYogur) => ({
    dias: [1, 2, 3, 4].map((n) => ({
      numeroDia: n,
      comidas: [{ orden: 1, alimentos: [{ indiceAlimento: 1, cantidad: cantidadYogur }, { indiceAlimento: 2, cantidad: 1 }] }],
    })),
  });

  // 4 × 1 = 4 yogures con 3 disponibles -> 0.75 cada uno (reducción del 25%)
  const pequeno = menu(1);
  assert.equal(caso._ajustarAlInventario(pequeno, [yogur, pan]).length, 1);
  assert.deepEqual(pequeno.dias.map((d) => d.comidas[0].alimentos[0].cantidad), [0.75, 0.75, 0.75, 0.75]);

  // 4 × 0.25 lechuga = 1 con 0.75 disponible -> 0.1875 -> 0.15 cada una
  const lechuga = menu(0.25);
  caso._ajustarAlInventario(lechuga, [{ ...yogur, cantidad: 0.75 }, pan]);
  assert.deepEqual(lechuga.dias.map((d) => d.comidas[0].alimentos[0].cantidad.toFixed(2)), ["0.15", "0.15", "0.15", "0.15"]);

  // 4 × 0.05 = 0.2 con 0.15 disponible -> 0.0375 se redondearía a 0: no se ajusta
  assert.throws(() => caso._ajustarAlInventario(menu(0.05), [{ ...yogur, cantidad: 0.15 }, pan]), ServicioExternoError);
});

test("con piezas (huevos) quita unidades enteras a las porciones más grandes en vez de dejar fracciones", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const huevos = { id: "h", nombre: "Huevos", cantidad: 12, unidadMedida: "unidad" };
  const porciones = [3, 3, 2, 2, 2, 2, 1]; // 15 huevos con 12 disponibles
  const resultado = {
    dias: porciones.map((c, i) => ({ numeroDia: i + 1, comidas: [{ orden: 1, alimentos: [{ indiceAlimento: 1, cantidad: c }] }] })),
  };
  caso._ajustarAlInventario(resultado, [huevos]);
  const ajustadas = resultado.dias.map((d) => d.comidas[0].alimentos[0].cantidad);
  assert.deepEqual(ajustadas, [1, 2, 2, 2, 2, 2, 1]);
  assert.ok(ajustadas.every(Number.isInteger));
  assert.equal(ajustadas.reduce((s, c) => s + c, 0), 12);
});

test("si el exceso es grande (más de 40%) pide otro menú con la corrección exacta", async () => {
  // 7 × 100 g = 700 g con 300 g disponibles
  const deps = crearDependencias({ alimentosDisponibles: [{ ...alimento, cantidad: 300 }] });
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10), ServicioExternoError);
  assert.equal(deps.generadorMenuIA.llamadas.length, 3);
  assert.match(deps.generadorMenuIA.llamadas[1].correccionAnterior, /solo hay 300 g para toda la semana/);
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

test("en cada reintento la IA recibe todas las correcciones anteriores, no solo la última", async () => {
  let llamada = 0;
  const deps = crearDependencias({ alimentosDisponibles: [{ ...alimento, cantidad: 300 }] });
  const generar = deps.generadorMenuIA.generar.bind(deps.generadorMenuIA);
  deps.generadorMenuIA.generar = async (args) => {
    llamada++;
    return generar(args);
  };
  const caso = new GenerarMenuSemanal(deps);
  await assert.rejects(() => caso.ejecutar(1, 10));
  const tercera = deps.generadorMenuIA.llamadas[2].correccionAnterior;
  assert.equal((tercera.match(/solo hay 300 g/g) || []).length, 2);
  assert.equal(llamada, 3);
});

// Arroz: 360 kcal por 100 g; huevo: 70 kcal por pieza de 50 g (140/100 g)
const arroz = {
  id: "a", nombre: "Arroz", cantidad: 2000, unidadMedida: "g",
  infoNutricional: { refUnidad: "g", refCantidad: 100, calorias: 360, proteinas: 7, carbohidratos: 79, grasasTotales: 0.7 },
};
const huevo = {
  id: "h", nombre: "Huevo", cantidad: 30, unidadMedida: "unidad",
  infoNutricional: { refUnidad: "g", refCantidad: 100, gramosPorPorcion: 50, calorias: 140, proteinas: 12.6, carbohidratos: 0.7, grasasTotales: 9.5 },
};
const menuDe = (gramosArroz, huevos = 2, dias = 1) => ({
  dias: Array.from({ length: dias }, (_, i) => ({
    numeroDia: i + 1,
    comidas: [{ orden: 1, alimentos: [{ indiceAlimento: 1, cantidad: gramosArroz }, { indiceAlimento: 2, cantidad: huevos }] }],
  })),
});

test("ajusta las porciones por peso hasta acercarse a la meta de calorías; las piezas no cambian", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const resultado = menuDe(200); // 720 + 140 = 860 kcal, meta 1500
  const informe = caso._ajustarCaloriasALaMeta(resultado, [arroz, huevo], 1500);
  const [detArroz, detHuevo] = resultado.dias[0].comidas[0].alimentos;
  assert.equal(detHuevo.cantidad, 2);
  assert.equal(detArroz.cantidad % 5, 0); // de 5 en 5 g
  const kcal = detArroz.cantidad * 3.6 + 140;
  assert.ok(Math.abs(kcal - 1500) <= 1500 * 0.05, `quedó en ${kcal} kcal`);
  assert.equal(informe[0].antes, 860);
});

test("también reduce si el día se pasa de la meta", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const resultado = menuDe(400); // 1440 + 140 = 1580, meta 1200
  caso._ajustarCaloriasALaMeta(resultado, [arroz, huevo], 1200);
  const kcal = resultado.dias[0].comidas[0].alimentos[0].cantidad * 3.6 + 140;
  assert.ok(Math.abs(kcal - 1200) <= 60);
});

test("el ajuste de calorías nunca usa más de lo que queda en el inventario", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const poco = { ...arroz, cantidad: 500 }; // 2 días × 200 g = 400 g usados, sobran 100 g
  const resultado = menuDe(200, 2, 2);
  caso._ajustarCaloriasALaMeta(resultado, [poco, huevo], 1500);
  const usado = resultado.dias.reduce((s, d) => s + d.comidas[0].alimentos[0].cantidad, 0);
  assert.ok(usado <= 500, `usó ${usado} g de 500`);
});

test("sin meta de calorías no cambia nada", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const resultado = menuDe(200);
  assert.deepEqual(caso._ajustarCaloriasALaMeta(resultado, [arroz, huevo], null), []);
  assert.equal(resultado.dias[0].comidas[0].alimentos[0].cantidad, 200);
});

test("si escalar los alimentos por peso no alcanza, suma piezas enteras (un huevo más) con inventario disponible", () => {
  const caso = new GenerarMenuSemanal(crearDependencias());
  const pocoArroz = { ...arroz, cantidad: 210 }; // solo sobran 10 g de arroz
  const resultado = menuDe(200, 2); // 720 + 140 = 860 kcal, meta 1100
  caso._ajustarCaloriasALaMeta(resultado, [pocoArroz, huevo], 1100);
  const [detArroz, detHuevo] = resultado.dias[0].comidas[0].alimentos;
  assert.ok(Number.isInteger(detHuevo.cantidad) && detHuevo.cantidad > 2, `huevos: ${detHuevo.cantidad}`);
  assert.ok(detArroz.cantidad <= 210);
  const kcal = detArroz.cantidad * 3.6 + detHuevo.cantidad * 70;
  assert.ok(kcal <= 1100 * 1.05);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const GeneradorMenuGroq = require("../GeneradorMenuGroq");
const { ServicioExternoError } = require("../../Dominio/Errores");

const perfilPaciente = { numeroComidas: 2 };
const alimentosDisponibles = [
  { id: "507f1f77bcf86cd799439011", nombre: "Arroz", cantidad: 500, unidadMedida: "g" },
];

function comidaValida(orden) {
  return {
    orden,
    tipoComida: "Desayuno",
    calorias: 400,
    alimentos: [{ idAlimento: "507f1f77bcf86cd799439011", cantidad: 100 }],
  };
}

function diaValido(numeroDia) {
  return { numeroDia, comidas: [comidaValida(1), comidaValida(2)] };
}

function respuestaValida() {
  return {
    dias: Array.from({ length: 7 }, (_, i) => diaValido(i + 1)),
    recomendacion: "Aumentar el consumo de fibra.",
  };
}

function crearGenerador(textoRespuesta) {
  const pedirCompletionFalso = async () => JSON.stringify(textoRespuesta);
  return new GeneradorMenuGroq(pedirCompletionFalso);
}

test("respuesta válida: devuelve dias y recomendacion", async () => {
  const generador = crearGenerador(respuestaValida());
  const resultado = await generador.generar({ perfilPaciente, alimentosDisponibles });
  assert.equal(resultado.dias.length, 7);
  assert.equal(resultado.recomendacion, "Aumentar el consumo de fibra.");
});

test("rechaza JSON no parseable", async () => {
  const generador = new GeneradorMenuGroq(async () => "esto no es JSON");
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza si dias.length !== 7", async () => {
  const respuesta = respuestaValida();
  respuesta.dias = respuesta.dias.slice(0, 6);
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza numeroDia repetido", async () => {
  const respuesta = respuestaValida();
  respuesta.dias = Array.from({ length: 7 }, () => diaValido(1)); // los 7 con numeroDia: 1
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza numeroDia fuera de 1..7", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].numeroDia = 9;
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza número de comidas distinto a numeroComidas del paciente", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas = [comidaValida(1)]; // solo 1, se esperaban 2
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza orden repetido dentro de un día", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas = [comidaValida(1), comidaValida(1)];
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza comida sin alimentos", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas[0].alimentos = [];
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza cantidad cero o negativa", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas[0].alimentos[0].cantidad = 0;
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza calorias negativas", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas[0].calorias = -1;
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza tipoComida vacío", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas[0].tipoComida = "  ";
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza recomendacion vacía", async () => {
  const respuesta = respuestaValida();
  respuesta.recomendacion = "";
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("rechaza idAlimento con formato inválido", async () => {
  const respuesta = respuestaValida();
  respuesta.dias[0].comidas[0].alimentos[0].idAlimento = "no-es-un-objectid";
  const generador = crearGenerador(respuesta);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    ServicioExternoError,
  );
});

test("propaga timeout como ServicioExternoError con statusCode 504", async () => {
  const { GroqTimeoutError } = require("../../../../Infraestructura/ia/groqClient");
  const pedirCompletionQueExpira = async () => {
    throw new GroqTimeoutError("timeout");
  };
  const generador = new GeneradorMenuGroq(pedirCompletionQueExpira);
  await assert.rejects(
    () => generador.generar({ perfilPaciente, alimentosDisponibles }),
    (error) => error instanceof ServicioExternoError && error.statusCode === 504,
  );
});

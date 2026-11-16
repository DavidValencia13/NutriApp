const test = require("node:test");
const assert = require("node:assert/strict");
const ChatAsistente = require("../ChatAsistente");

function crearCaso({ idNutriologo = 7, menu = null, aprobado = null } = {}) {
  const llamadas = [];
  const chat = new ChatAsistente({
    pacienteRepo: { findById: async () => ({ id: 3, idNutriologo, nombre: "Ana", peso: 68.5, pesoInicial: 70.4, altura: 1.64, objetivo: "Perder peso", nivelActividad: "moderado", numeroComidas: 4, presupuesto: 60, tiempoParaCocinar: 30 }) },
    seguimientoRepo: { listarPorPaciente: async () => [{ fecha: "2026-11-16", peso: 68.5, nivelCumplimiento: "buena" }] },
    menuRepo: {
      obtenerMasRecientePorPaciente: async () => menu,
      obtenerMasRecienteAprobadoPorPaciente: async () => aprobado,
    },
    ingestaRepo: { listar: async () => [{ fecha: "2026-11-16", nombreAlimento: "Fréjol", cantidad: 100, unidad: "g", fuente: "USFQ", nutrientes: { calorias: 132, proteinas: 8 } }] },
    asistenteIA: { chat: async (datos) => { llamadas.push(datos); return "Respuesta"; } },
  });
  return { chat, llamadas };
}

test("el profesional recibe menú del paciente, diario y controles", async () => {
  const menu = { estado: "generado", dias: [{ numeroDia: 1, caloriasTotales: 1600, comidas: [{ tipoComida: "almuerzo", nombrePlato: "Arroz con fréjol", calorias: 500, detalles: [{ nombreAlimento: "Fréjol", cantidadUtilizada: 100, unidadMedida: "g" }] }] }] };
  const { chat, llamadas } = crearCaso({ menu });
  const resultado = await chat.ejecutar({ idPaciente: 3, idNutriologo: 7, mensaje: "¿Qué come?", rol: "nutriologo" });
  assert.equal(resultado.respuesta, "Respuesta");
  assert.match(llamadas[0].systemPrompt, /Arroz con fréjol/);
  assert.match(llamadas[0].systemPrompt, /132\.0 kcal/);
  assert.match(llamadas[0].systemPrompt, /borrador/);
  assert.equal(llamadas[0].historial.at(-1).content, "¿Qué come?");
});

test("el paciente recibe solamente menú aprobado", async () => {
  const { chat, llamadas } = crearCaso({ menu: { estado: "generado", dias: [] }, aprobado: { estado: "aprobado", dias: [{ numeroDia: 1, comidas: [{ nombrePlato: "Locro", tipoComida: "almuerzo" }] }] } });
  await chat.ejecutar({ idPaciente: 3, mensaje: "Mi menú", rol: "paciente" });
  assert.match(llamadas[0].systemPrompt, /Locro/);
  assert.doesNotMatch(llamadas[0].systemPrompt, /Estado: generado/);
  assert.match(llamadas[0].systemPrompt, /el paciente/);
});

test("no revela ni consulta datos de otro profesional", async () => {
  const { chat, llamadas } = crearCaso({ idNutriologo: 8 });
  await assert.rejects(() => chat.ejecutar({ idPaciente: 3, idNutriologo: 7, mensaje: "hola" }), { statusCode: 404 });
  assert.equal(llamadas.length, 0);
});

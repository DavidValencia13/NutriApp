const test = require("node:test");
const assert = require("node:assert/strict");
const AsistenteController = require("../AsistenteController");

function respuesta() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("portal usa el id del token, nunca el id del cuerpo", async () => {
  let recibido;
  const controller = new AsistenteController({ chatAsistente: { ejecutar: async (datos) => {
    recibido = datos;
    return { respuesta: "Hola", proveedor: "groq" };
  } } });
  const res = respuesta();
  await controller.chatPaciente({ idPaciente: 3, body: { idPaciente: 999, mensaje: "Mi menú" } }, res, (error) => { throw error; });
  assert.equal(res.statusCode, 200);
  assert.equal(recibido.idPaciente, 3);
  assert.equal(recibido.rol, "paciente");
});

test("portal rechaza mensajes inválidos antes de consultar la IA", async () => {
  let llamadas = 0;
  const controller = new AsistenteController({ chatAsistente: { ejecutar: async () => { llamadas++; } } });
  const res = respuesta();
  await controller.chatPaciente({ idPaciente: 3, body: { mensaje: " ".repeat(2) } }, res, (error) => { throw error; });
  assert.equal(res.statusCode, 400);
  assert.equal(llamadas, 0);
});

test("el profesional rechaza id de paciente no válido", async () => {
  const controller = new AsistenteController({ chatAsistente: { ejecutar: async () => { throw new Error("No debe llamarse"); } } });
  const res = respuesta();
  await controller.chat({ nutriologo: { id: 7 }, body: { idPaciente: -1, mensaje: "hola" } }, res, (error) => { throw error; });
  assert.equal(res.statusCode, 400);
});

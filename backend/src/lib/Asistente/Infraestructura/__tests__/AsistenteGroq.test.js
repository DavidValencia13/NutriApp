const test = require("node:test");
const assert = require("node:assert/strict");
const AsistenteGroq = require("../AsistenteGroq");

test("pide JSON a Groq y entrega solo el texto al chat", async () => {
  let mensajes;
  const asistente = new AsistenteGroq(async (entrada) => {
    mensajes = entrada;
    return JSON.stringify({ respuesta: "  Revisa el registro de peso.  " });
  });
  const respuesta = await asistente.chat({ systemPrompt: "Contexto clínico", historial: [{ role: "user", content: "¿Qué recomiendas?" }] });
  assert.match(mensajes[0].content, /JSON/);
  assert.equal(mensajes[1].content, "¿Qué recomiendas?");
  assert.equal(respuesta, "Revisa el registro de peso.");
});

test("rechaza una respuesta sin texto válido", async () => {
  const asistente = new AsistenteGroq(async () => JSON.stringify({ otro: "valor" }));
  await assert.rejects(() => asistente.chat({ systemPrompt: "Contexto", historial: [] }), { statusCode: 502 });
});

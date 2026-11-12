const test = require("node:test");
const assert = require("node:assert/strict");

const {
  textoDeRespuesta,
  extraerJSON,
  pedirCompletionJSON,
  razonamientoMenu,
  AnthropicRequestError,
} = require("../anthropicClient");
const { IARequestError } = require("../errores");

test("lee el texto aunque el primer bloque sea el razonamiento (thinking)", () => {
  const response = {
    stop_reason: "end_turn",
    content: [
      { type: "thinking", thinking: "" },
      { type: "text", text: '{"ok":true}' },
    ],
  };
  assert.equal(textoDeRespuesta(response), '{"ok":true}');
});

test("una respuesta declinada (refusal) es un error, no texto vacío", () => {
  assert.throws(
    () => textoDeRespuesta({ stop_reason: "refusal", content: [] }),
    AnthropicRequestError,
  );
});

test("extrae el objeto JSON aunque venga envuelto en un bloque de código", () => {
  assert.equal(extraerJSON('```json\n{"nombreIngles":"Apples, raw"}\n```'), '{"nombreIngles":"Apples, raw"}');
  assert.equal(extraerJSON('{"a":1}'), '{"a":1}');
});

test("sin ANTHROPIC_API_KEY lanza un error de IA (no llama a la API)", async () => {
  const anterior = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(
      () => pedirCompletionJSON([{ role: "user", content: "hola json" }]),
      IARequestError,
    );
  } finally {
    if (anterior !== undefined) process.env.ANTHROPIC_API_KEY = anterior;
  }
});

test("el menú se genera sin razonamiento, con la forma que acepta cada modelo", () => {
  assert.deepEqual(razonamientoMenu("claude-haiku-5-5"), { thinking: { type: "disabled" } });
  assert.deepEqual(razonamientoMenu("claude-sonnet-5-5"), { thinking: { type: "between_tools" } });
  assert.deepEqual(razonamientoMenu("claude-opus-5-5"), { output_config: { effort: "low" } });
});

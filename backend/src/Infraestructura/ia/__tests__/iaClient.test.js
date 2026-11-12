const test = require("node:test");
const assert = require("node:assert/strict");

const { proveedorIA } = require("../iaClient");

test("IA_PROVIDER elige el proveedor (groq por defecto)", () => {
  const anterior = process.env.IA_PROVIDER;
  try {
    delete process.env.IA_PROVIDER;
    assert.equal(proveedorIA(), "groq");
    process.env.IA_PROVIDER = "Anthropic";
    assert.equal(proveedorIA(), "anthropic");
    process.env.IA_PROVIDER = "otro";
    assert.equal(proveedorIA(), "groq");
  } finally {
    if (anterior === undefined) delete process.env.IA_PROVIDER;
    else process.env.IA_PROVIDER = anterior;
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");

const { PersonalizarMarca, normalizarMarca } = require("../PersonalizarMarca");

const LOGO = "data:image/png;base64,iVBORw0KGgo=";

function repoFalso() {
  const fila = { id: 1, marca: null };
  return {
    fila,
    async findById(id) { return id === 1 ? fila : null; },
    async updateById(id, datos) {
      if (id !== 1) return null;
      Object.assign(fila, datos);
      return fila;
    },
  };
}

test("normaliza textos y valida color, estilo y logo", () => {
  assert.deepEqual(
    normalizarMarca({
      nombreConsulta: "  Nutri   Vida ", especialidad: "Nutrición clínica", mensajeBienvenida: " Hola ",
      color: "azul", estiloEncabezado: "ondas", logo: LOGO,
    }),
    {
      nombreConsulta: "Nutri Vida", especialidad: "Nutrición clínica", mensajeBienvenida: "Hola", color: "azul",
      estiloEncabezado: "ondas", tipografia: null, bordes: null, fondo: null, logo: LOGO,
    },
  );
  assert.equal(normalizarMarca({ color: "#1A2B3C" }).color, "#1a2b3c"); // color propio
  assert.throws(() => normalizarMarca({ color: "rojo" }), /color/);
  assert.throws(() => normalizarMarca({ color: "#12345" }), /color/);
  assert.throws(() => normalizarMarca({ estiloEncabezado: "neon" }), /Estilo/);
  assert.deepEqual(
    (({ tipografia, bordes, fondo }) => ({ tipografia, bordes, fondo }))(normalizarMarca({ tipografia: "clasica", bordes: "rectos", fondo: "liso" })),
    { tipografia: "clasica", bordes: "rectos", fondo: "liso" },
  );
  assert.throws(() => normalizarMarca({ tipografia: "comic" }), /Opción de diseño/);
  assert.throws(() => normalizarMarca({ bordes: "zigzag" }), /Opción de diseño/);
  assert.throws(() => normalizarMarca({ logo: "data:image/svg+xml;base64,PHN2Zz4=" }), /PNG, JPG o WebP/);
  assert.throws(() => normalizarMarca({ logo: "javascript:alert(1)" }), /PNG, JPG o WebP/);
  assert.throws(() => normalizarMarca({ logo: `data:image/png;base64,${"A".repeat(95000)}` }), /pesado/);
  assert.throws(() => normalizarMarca({ nombreConsulta: "x".repeat(61) }), /60/);
  assert.throws(() => normalizarMarca({ mensajeBienvenida: "x".repeat(161) }), /160/);
});

test("guarda, devuelve y se puede volver al diseño original", async () => {
  const repo = repoFalso();
  const caso = new PersonalizarMarca(repo);
  assert.equal((await caso.obtener(1)).color, null);

  const guardada = await caso.guardar(1, { nombreConsulta: "Consultorio Sánchez", color: "morado" });
  assert.equal(guardada.color, "morado");
  assert.equal(guardada.especialidad, null);
  assert.equal(repo.fila.marca.nombreConsulta, "Consultorio Sánchez");

  await caso.guardar(1, {});
  assert.equal(repo.fila.marca, null); // todo vacío = diseño original de NutriApp
  await assert.rejects(() => caso.guardar(2, {}), /no encontrado/);
});

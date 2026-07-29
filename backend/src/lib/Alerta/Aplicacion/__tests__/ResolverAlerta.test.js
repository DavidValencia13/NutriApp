const test = require("node:test");
const assert = require("node:assert/strict");

const ResolverAlerta = require("../ResolverAlerta");
const { NotFoundError, ValidationError } = require("../../Dominio/Errores");

function crearDependencias({ alerta } = {}) {
  const alertaRepository = {
    llamadasResolver: [],
    async obtenerConPropietario() {
      return alerta !== undefined ? alerta : { id: 1, estado: "pendiente" };
    },
    async resolver(idAlerta, cambios) {
      this.llamadasResolver.push({ idAlerta, cambios });
      return { id: idAlerta, ...cambios };
    },
  };
  return { alertaRepository };
}

test("rechaza un estado fuera de aceptada/corregida/ignorada", async () => {
  const deps = crearDependencias();
  const caso = new ResolverAlerta(deps);
  await assert.rejects(
    () => caso.ejecutar(1, 10, { estado: "pendiente" }),
    ValidationError,
  );
  await assert.rejects(
    () => caso.ejecutar(1, 10, { estado: "otracosa" }),
    ValidationError,
  );
});

test("lanza NotFoundError si la alerta no existe o no pertenece al nutriólogo", async () => {
  const deps = crearDependencias({ alerta: null });
  const caso = new ResolverAlerta(deps);
  await assert.rejects(
    () => caso.ejecutar(1, 10, { estado: "aceptada" }),
    NotFoundError,
  );
});

test("resuelve con estado y observación opcional", async () => {
  const deps = crearDependencias();
  const caso = new ResolverAlerta(deps);
  await caso.ejecutar(1, 10, { estado: "ignorada", observacion: "el paciente ya lo sabe" });

  assert.equal(deps.alertaRepository.llamadasResolver.length, 1);
  assert.equal(deps.alertaRepository.llamadasResolver[0].cambios.estado, "ignorada");
  assert.equal(deps.alertaRepository.llamadasResolver[0].cambios.observacion, "el paciente ya lo sabe");
});

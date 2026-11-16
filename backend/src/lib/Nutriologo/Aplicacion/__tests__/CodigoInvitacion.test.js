const test = require("node:test");
const assert = require("node:assert/strict");

const RegistrarNutriologo = require("../RegistrarNutriologo");
const limitarMenusPorDia = require("../../../Menu/Infraestructura/http/limitarMenusPorDia");

function repoFalso() {
  const guardados = [];
  return {
    guardados,
    async findByEmail() {
      return null;
    },
    async save(n) {
      guardados.push(n);
      return { id: 1, ...n };
    },
  };
}

const datos = { nombre: "Ana", apellido: "Perez", email: "ana@correo.com", password: "clave123" };

test("con código de invitación configurado, solo se registra quien lo tiene", async () => {
  const repo = repoFalso();
  const caso = new RegistrarNutriologo(repo, { codigoInvitacion: "NUTRI-2026" });
  await assert.rejects(() => caso.ejecutar(datos), /código de invitación/);
  await assert.rejects(() => caso.ejecutar({ ...datos, codigoInvitacion: "otro" }), /código de invitación/);
  await caso.ejecutar({ ...datos, codigoInvitacion: " NUTRI-2026 " });
  assert.equal(repo.guardados.length, 1);
});

test("sin código configurado (computadora local) el registro sigue abierto", async () => {
  const repo = repoFalso();
  await new RegistrarNutriologo(repo).ejecutar(datos);
  assert.equal(repo.guardados.length, 1);
});

function respuestaFalsa() {
  return {
    codigo: null,
    cuerpo: null,
    status(c) {
      this.codigo = c;
      return this;
    },
    json(b) {
      this.cuerpo = b;
      return this;
    },
  };
}

test("el límite de menús corta al llegar a N en 24 horas", async () => {
  const repo = (n) => ({ async contarGeneradosPorNutriologoDesde() { return n; } });
  const req = { nutriologo: { id: 1 } };

  let siguio = false;
  await limitarMenusPorDia(repo(9), 10)(req, respuestaFalsa(), () => (siguio = true));
  assert.equal(siguio, true);

  siguio = false;
  const res = respuestaFalsa();
  await limitarMenusPorDia(repo(10), 10)(req, res, () => (siguio = true));
  assert.equal(siguio, false);
  assert.equal(res.codigo, 429);

  siguio = false;
  await limitarMenusPorDia(repo(500), 0)(req, respuestaFalsa(), () => (siguio = true));
  assert.equal(siguio, true); // 0 = sin límite
});

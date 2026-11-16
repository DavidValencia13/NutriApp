const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-prueba";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { listaDeCompras } = require("../Dominio/Servicios/ListaCompras");
const { resumenCumplimiento, nivelDeCumplimiento } = require("../Dominio/Servicios/ResumenCumplimiento");
const MarcaComida = require("../Dominio/Entidades/MarcaComida");
const GestionarAccesoPaciente = require("../Aplicacion/GestionarAccesoPaciente");
const LoginPaciente = require("../Aplicacion/LoginPaciente");
const PortalPaciente = require("../Aplicacion/PortalPaciente");
const { ConflictError, ValidationError, CredencialesError, NotFoundError } = require("../Dominio/Errores");

const avena = "a".repeat(24);
const leche = "b".repeat(24);
const menu = {
  id: 1,
  dias: [
    {
      numeroDia: 1,
      comidas: [
        { id: 11, tipoComida: "Desayuno", nombrePlato: "Avena con leche", detalles: [
          { idAlimento: avena, nombreAlimento: "Avena", unidadMedida: "kg", cantidadUtilizada: "0.04", costoTotal: "0.10" },
          { idAlimento: leche, nombreAlimento: "Leche", unidadMedida: "l", cantidadUtilizada: "0.25", costoTotal: "0.30" },
        ] },
        { id: 12, tipoComida: "Almuerzo", nombrePlato: "Arroz con pollo", detalles: [] },
      ],
    },
    {
      numeroDia: 2,
      comidas: [
        { id: 21, tipoComida: "Desayuno", nombrePlato: "Avena", detalles: [
          { idAlimento: avena, nombreAlimento: "Avena", unidadMedida: "kg", cantidadUtilizada: "0.05", costoTotal: "0.12" },
        ] },
        { id: 22, tipoComida: "Almuerzo", nombrePlato: "Lentejas", detalles: [] },
      ],
    },
  ],
};

test("la lista de compras suma cada alimento de toda la semana", () => {
  const lista = listaDeCompras(menu);
  assert.deepEqual(lista.map((i) => [i.nombre, i.cantidad, i.costo]), [["Avena", 0.09, 0.22], ["Leche", 0.25, 0.3]]);
  assert.equal(lista[0].cantidadCompra, 0.1); // 90 g -> 100 g
});

test("la cantidad de compra se redondea a como se vende", () => {
  const { cantidadDeCompra } = require("../Dominio/Servicios/ListaCompras");
  assert.equal(cantidadDeCompra("unidad", 0.3), 1); // no se compra 0.3 lechuga
  assert.equal(cantidadDeCompra("unidad", 2.02), 2); // no sube por un pelito
  assert.equal(cantidadDeCompra("unidad", 2.4), 3);
  assert.equal(cantidadDeCompra("kg", 1.01), 1);
  assert.equal(cantidadDeCompra("l", 3.05), 3.1);
  assert.equal(cantidadDeCompra("kg", 0.62), 0.65);
  assert.equal(cantidadDeCompra("kg", 0.5), 0.5);

  const lechuga = listaDeCompras({ dias: [{ comidas: [{ detalles: [
    { idAlimento: "c".repeat(24), nombreAlimento: "Lechuga", unidadMedida: "unidad", cantidadUtilizada: "0.3", costoTotal: "0.2" },
  ] }] }] })[0];
  assert.equal(lechuga.cantidadCompra, 1);
  assert.equal(lechuga.nota, "usarás un tercio");
});

test("cumplimiento: completa = 1, parte = 0.5, no = 0, solo sobre lo marcado", () => {
  const r = resumenCumplimiento(menu, [
    { idComidaMenu: 11, estado: "si" },
    { idComidaMenu: 12, estado: "parte", nota: "muy grande" },
    { idComidaMenu: 21, estado: "no" },
  ]);
  assert.equal(r.porcentaje, 50); // (1 + 0.5 + 0) / 3
  assert.equal(r.nivel, "regular");
  assert.equal(r.comidasMarcadas, 3);
  assert.equal(r.comidasTotales, 4);
  assert.deepEqual(r.grilla.map((f) => f.momento), ["Desayuno", "Almuerzo"]);
  assert.deepEqual(r.grilla[0].dias.map((d) => d.estado), ["si", "no"]);
  assert.equal(r.notas[0].nota, "muy grande");
  assert.equal(resumenCumplimiento(menu, []).porcentaje, null);
  assert.equal(nivelDeCumplimiento(85), "bien");
  assert.equal(nivelDeCumplimiento(30), "mal");
});

test("una marca de comida solo acepta si / parte / no", () => {
  assert.throws(() => new MarcaComida({ idPaciente: 1, idComidaMenu: 2, estado: "tal vez" }), ValidationError);
  assert.equal(new MarcaComida({ idPaciente: 1, idComidaMenu: 2, estado: "si", nota: "  " }).nota, null);
});

function repoAccesosFalso(inicial = []) {
  const filas = [...inicial];
  return {
    filas,
    async findByPaciente(id) { return filas.find((f) => f.idPaciente === id) || null; },
    async findByEmail(email) { return filas.find((f) => f.email === email) || null; },
    async guardar(datos) {
      const i = filas.findIndex((f) => f.idPaciente === datos.idPaciente);
      if (i >= 0) filas[i] = { ...filas[i], ...datos }; else filas.push({ id: filas.length + 1, ...datos });
      return filas.find((f) => f.idPaciente === datos.idPaciente);
    },
    async eliminarPorPaciente(id) {
      const i = filas.findIndex((f) => f.idPaciente === id);
      if (i < 0) return false;
      filas.splice(i, 1);
      return true;
    },
  };
}

test("el nutriólogo crea el acceso con correo y contraseña (guardada encriptada)", async () => {
  const repo = repoAccesosFalso();
  const caso = new GestionarAccesoPaciente(repo);
  await assert.rejects(() => caso.guardar(5, { email: "ana@correo.com" }), ValidationError); // sin contraseña
  await assert.rejects(() => caso.guardar(5, { email: "ana@correo.com", password: "123" }), ValidationError);
  const r = await caso.guardar(5, { email: " Ana@Correo.com ", password: "clave123" });
  assert.deepEqual(r, { tieneAcceso: true, email: "ana@correo.com" });
  assert.notEqual(repo.filas[0].password, "clave123");
  assert.ok(await bcrypt.compare("clave123", repo.filas[0].password));

  // Cambiar solo el correo conserva la contraseña
  const hashAnterior = repo.filas[0].password;
  await caso.guardar(5, { email: "ana2@correo.com" });
  assert.equal(repo.filas[0].password, hashAnterior);

  await assert.rejects(() => caso.guardar(6, { email: "ana2@correo.com", password: "otra123" }), ConflictError);
});

test("login del paciente: token con rol paciente; credenciales malas dan el mismo error", async () => {
  const repo = repoAccesosFalso([{ idPaciente: 5, email: "ana@correo.com", password: await bcrypt.hash("clave123", 4) }]);
  const caso = new LoginPaciente({ accesoRepository: repo, pacienteRepository: { async findById(id) { return { id, nombre: "Ana" }; } } });
  const r = await caso.ejecutar({ email: "ANA@correo.com", password: "clave123" });
  const payload = jwt.verify(r.token, process.env.JWT_SECRET);
  assert.equal(payload.rol, "paciente");
  assert.equal(payload.idPaciente, 5);
  await assert.rejects(() => caso.ejecutar({ email: "ana@correo.com", password: "mala" }), CredencialesError);
  await assert.rejects(() => caso.ejecutar({ email: "nadie@correo.com", password: "clave123" }), CredencialesError);
});

test("el paciente solo puede marcar comidas de su menú aprobado", async () => {
  const marcas = [];
  const portal = new PortalPaciente({
    menuRepository: { async obtenerMasRecienteAprobadoPorPaciente() { return menu; } },
    marcaRepository: {
      async guardar(m) { marcas.push(m); return m; },
      async eliminar() {},
      async listarPorComidas() { return marcas; },
    },
  });
  await assert.rejects(() => portal.marcarComida(5, 999, { estado: "si" }), NotFoundError);
  const m = await portal.marcarComida(5, 11, { estado: "parte", nota: "sin hambre" });
  assert.equal(m.estado, "parte");
  assert.equal(await portal.marcarComida(5, 11, { estado: null }), null);
});

test("el peso que registra el paciente entra al seguimiento con el cumplimiento del menú", async () => {
  let registrado;
  const portal = new PortalPaciente({
    menuRepository: { async obtenerMasRecienteAprobadoPorPaciente() { return menu; } },
    marcaRepository: { async listarPorComidas() { return [{ idComidaMenu: 11, estado: "si" }, { idComidaMenu: 12, estado: "si" }]; } },
    registrarSeguimiento: { async ejecutar(d) { registrado = d; return d; } },
  });
  await assert.rejects(() => portal.registrarPeso(5, { peso: "abc" }), ValidationError);
  await portal.registrarPeso(5, { peso: 67.2 });
  assert.equal(registrado.peso, 67.2);
  assert.equal(registrado.nivelCumplimiento, "bien");
  assert.match(registrado.observaciones, /100%/);
});

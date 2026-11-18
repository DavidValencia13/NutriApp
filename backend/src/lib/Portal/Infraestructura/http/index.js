const express = require("express");

const { AccesoPacienteRepositorySequelize, MarcaComidaRepositorySequelize } = require("../repositorios");
const GestionarAccesoPaciente = require("../../Aplicacion/GestionarAccesoPaciente");
const LoginPaciente = require("../../Aplicacion/LoginPaciente");
const PortalPaciente = require("../../Aplicacion/PortalPaciente");
const ObtenerCumplimientoPaciente = require("../../Aplicacion/ObtenerCumplimientoPaciente");
const pacienteAuthMiddleware = require("./pacienteAuthMiddleware");

const authMiddleware = require("../../../Nutriologo/Infraestructura/http/authMiddleware");
const verificarPropietarioPaciente = require("../../../Alimento/Infraestructura/http/verificarPropietarioPaciente");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const NutriologoRepositorySequelize = require("../../../Nutriologo/Infraestructura/NutriologoRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");
const RegistrarSeguimiento = require("../../../Seguimiento/Aplicacion/RegistrarSeguimiento");
const ExplicarPreparacionMenu = require("../../../Menu/Aplicacion/ExplicarPreparacionMenu");
const GeneradorPreparacionIA = require("../../../Menu/Infraestructura/GeneradorPreparacionIA");
const { pedirCompletion } = require("../../../../Infraestructura/ia/iaClient");
const ReferenciaUSFQModel = require("../../../Alimento/Infraestructura/ReferenciaUSFQModel");
const RegistroIngestaRepositorySequelize = require("../RegistroIngestaRepositorySequelize");
const DiarioIngesta = require("../../Aplicacion/DiarioIngesta");

// Errores de dominio (statusCode) → su código; el resto al manejador global
const manejar = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

module.exports = function registerPortalModule(app) {
  const accesoRepo = new AccesoPacienteRepositorySequelize();
  const marcaRepo = new MarcaComidaRepositorySequelize();
  const pacienteRepo = new PacienteRepositorySequelize();
  const menuRepo = new MenuRepositorySequelize();
  const seguimientoRepo = new SeguimientoRepositorySequelize();
  const diario = new DiarioIngesta({
    referenciaModel: ReferenciaUSFQModel,
    registroRepository: new RegistroIngestaRepositorySequelize(),
  });

  const gestionarAcceso = new GestionarAccesoPaciente(accesoRepo);
  const loginPaciente = new LoginPaciente({ accesoRepository: accesoRepo, pacienteRepository: pacienteRepo });
  const portal = new PortalPaciente({
    pacienteRepository: pacienteRepo,
    nutriologoRepository: new NutriologoRepositorySequelize(),
    menuRepository: menuRepo,
    marcaRepository: marcaRepo,
    seguimientoRepository: seguimientoRepo,
    registrarSeguimiento: new RegistrarSeguimiento(seguimientoRepo),
    completarPreparacion: new ExplicarPreparacionMenu({
      menuRepository: menuRepo,
      generadorPreparacion: new GeneradorPreparacionIA(pedirCompletion),
    }),
  });
  const obtenerCumplimiento = new ObtenerCumplimientoPaciente({ menuRepository: menuRepo, marcaRepository: marcaRepo, accesoRepository: accesoRepo });

  // ── Nutriólogo: acceso de su paciente y cumplimiento del menú ──
  const acceso = express.Router({ mergeParams: true });
  acceso.get("/", manejar(async (req, res) => res.json(await gestionarAcceso.obtener(req.idPaciente))));
  acceso.put("/", manejar(async (req, res) => res.json(await gestionarAcceso.guardar(req.idPaciente, req.body || {}))));
  acceso.delete("/", manejar(async (req, res) => {
    await gestionarAcceso.eliminar(req.idPaciente);
    res.status(204).send();
  }));
  const soloDueno = [authMiddleware, verificarPropietarioPaciente(pacienteRepo)];
  app.use("/api/paciente/:idPaciente/acceso", ...soloDueno, acceso);
  app.get("/api/paciente/:idPaciente/cumplimiento", ...soloDueno,
    manejar(async (req, res) => res.json(await obtenerCumplimiento.ejecutar(req.idPaciente))));
  app.get("/api/paciente/:idPaciente/ingestas", ...soloDueno,
    manejar(async (req, res) => res.json(await diario.listar(req.idPaciente))));

  // ── Paciente: su app ──
  const portalRouter = express.Router();
  portalRouter.post("/login", manejar(async (req, res) => res.json(await loginPaciente.ejecutar(req.body || {}))));
  portalRouter.use(pacienteAuthMiddleware);
  portalRouter.get("/perfil", manejar(async (req, res) => res.json(await portal.perfil(req.idPaciente))));
  portalRouter.get("/menu", manejar(async (req, res) => res.json(await portal.menu(req.idPaciente))));
  portalRouter.get("/compras", manejar(async (req, res) => res.json(await portal.compras(req.idPaciente))));
  portalRouter.get("/alimentos", manejar(async (req, res) => res.json(await diario.buscarAlimentos(req.query.q))));
  portalRouter.get("/ingestas", manejar(async (req, res) => res.json(await diario.listar(req.idPaciente))));
  portalRouter.post("/ingestas", manejar(async (req, res) => res.status(201).json(await diario.registrar(req.idPaciente, req.body || {}))));
  portalRouter.delete("/ingestas/:id", manejar(async (req, res) => {
    await diario.eliminar(req.idPaciente, req.params.id);
    res.status(204).send();
  }));
  portalRouter.put("/comidas/:idComidaMenu/marca", manejar(async (req, res) => {
    res.json({ marca: await portal.marcarComida(req.idPaciente, req.params.idComidaMenu, req.body || {}) });
  }));
  portalRouter.get("/progreso", manejar(async (req, res) => res.json(await portal.progreso(req.idPaciente))));
  portalRouter.post("/peso", manejar(async (req, res) => res.status(201).json(await portal.registrarPeso(req.idPaciente, req.body || {}))));
  app.use("/api/portal", portalRouter);
};

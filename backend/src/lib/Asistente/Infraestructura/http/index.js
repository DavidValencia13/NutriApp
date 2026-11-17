const AsistenteRoutes = require("./AsistenteRoutes");
const AsistenteController = require("./AsistenteController");
const ChatAsistente = require("../../Aplicacion/ChatAsistente");
const ResumenPaciente14Dias = require("../../Aplicacion/ResumenPaciente14Dias");
const { crearAsistenteIA } = require("../asistenteIAFactory");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");
const MenuRepositorySequelize = require("../../../Menu/Infraestructura/MenuRepositorySequelize");
const RegistroIngestaRepositorySequelize = require("../../../Portal/Infraestructura/RegistroIngestaRepositorySequelize");
const { MarcaComidaRepositorySequelize } = require("../../../Portal/Infraestructura/repositorios");
const pacienteAuthMiddleware = require("../../../Portal/Infraestructura/http/pacienteAuthMiddleware");

module.exports = function registerAsistenteModule(app) {
  const asistenteIA = crearAsistenteIA();
  const pacienteRepo = new PacienteRepositorySequelize();
  const seguimientoRepo = new SeguimientoRepositorySequelize();
  const menuRepo = new MenuRepositorySequelize();
  const ingestaRepo = new RegistroIngestaRepositorySequelize();
  const marcaRepo = new MarcaComidaRepositorySequelize();
  const resumenPaciente14Dias = new ResumenPaciente14Dias({ seguimientoRepo, menuRepo, ingestaRepo, marcaRepo });

  const controller = new AsistenteController({
    chatAsistente: new ChatAsistente({ pacienteRepo, menuRepo, resumenPaciente14Dias, asistenteIA }),
  });

  app.use("/api/asistente", AsistenteRoutes(controller));
  app.post("/api/portal/asistente/chat", pacienteAuthMiddleware, (req, res, next) =>
    controller.chatPaciente(req, res, next));

  const proveedor = (process.env.IA_PROVIDER || "groq").toLowerCase();
  const modelos =
    proveedor === "anthropic"
      ? `${process.env.ANTHROPIC_MODEL || "claude-haiku-5-5"}; menús: ${process.env.ANTHROPIC_MODEL_MENU || "claude-sonnet-5-5"}`
      : process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  console.log(`[IA] Proveedor: ${proveedor} (${modelos}) — asistente, menús y traducción de alimentos`);
};

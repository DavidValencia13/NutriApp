const AsistenteRoutes = require("./AsistenteRoutes");
const AsistenteController = require("./AsistenteController");
const ChatAsistente = require("../../Aplicacion/ChatAsistente");
const { crearAsistenteIA } = require("../asistenteIAFactory");
const PacienteRepositorySequelize = require("../../../Paciente/Infraestructura/PacienteRepositorySequelize");
const SeguimientoRepositorySequelize = require("../../../Seguimiento/Infraestructura/SeguimientoRepositorySequelize");

module.exports = function registerAsistenteModule(app) {
  const asistenteIA = crearAsistenteIA();
  const pacienteRepo = new PacienteRepositorySequelize();
  const seguimientoRepo = new SeguimientoRepositorySequelize();

  const controller = new AsistenteController({
    chatAsistente: new ChatAsistente({ pacienteRepo, seguimientoRepo, asistenteIA }),
  });

  app.use("/api/asistente", AsistenteRoutes(controller));

  const proveedor = (process.env.IA_PROVIDER || "groq").toLowerCase();
  const modelos =
    proveedor === "anthropic"
      ? `${process.env.ANTHROPIC_MODEL || "claude-haiku-5-5"}; menús: ${process.env.ANTHROPIC_MODEL_MENU || "claude-sonnet-5-5"}`
      : process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  console.log(`[IA] Proveedor: ${proveedor} (${modelos}) — asistente, menús y traducción de alimentos`);
};

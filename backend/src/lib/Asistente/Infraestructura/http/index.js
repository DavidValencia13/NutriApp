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

  console.log(`[Asistente] Proveedor IA: ${process.env.IA_PROVIDER || "groq"}`);
};

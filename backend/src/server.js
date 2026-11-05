require("dotenv").config();

const buildApp = require("./app");
const { connectPostgres } = require("./Infraestructura/database/postgres");
const { connectMongo } = require("./Infraestructura/database/mongo");

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Falta JWT_SECRET en el .env: sin ella no se pueden firmar sesiones de forma segura");
  }

  const port = Number(process.env.PORT) || 3000;

  await connectPostgres();
  await connectMongo();

  const app = buildApp();

  app.listen(port, () => {
    console.log(`Servidor NutriApp corriendo en el puerto: ${port}`);
  });
}

start().catch((e) => {
  console.error("Error al iniciar el servidor:", e);
  process.exit(1);
});

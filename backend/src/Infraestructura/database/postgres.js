const { Sequelize } = require("sequelize");

// En la nube (Neon) se usa una sola URL de conexión con SSL obligatorio;
// en la computadora local, las variables POSTGRES_* de siempre.
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(
      process.env.POSTGRES_DB || "nutriapp",
      process.env.POSTGRES_USER || "postgres",
      process.env.POSTGRES_PASSWORD || "postgres",
      {
        host: process.env.POSTGRES_HOST || "localhost",
        dialect: "postgres",
        logging: false,
      },
    );

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Conectado a PostgreSQL: nutriapp");
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error);
    throw new Error("No se pudo conectar a PostgreSQL");
  }
}

module.exports = { sequelize, connectPostgres };

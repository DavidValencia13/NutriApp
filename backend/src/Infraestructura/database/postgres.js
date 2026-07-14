const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
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

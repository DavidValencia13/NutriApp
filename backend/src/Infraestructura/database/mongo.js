const mongoose = require("mongoose");

async function connectMongo() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nutriapp";
    await mongoose.connect(uri);
    console.log("Conectado a MongoDB: nutriapp");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    throw new Error("No se pudo conectar a MongoDB");
  }
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = { connectMongo, disconnectMongo };

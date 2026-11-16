const Paciente = require("../Dominio/Entidades/Paciente");
const Alimento = require("../../Alimento/Dominio/Entidades/Alimento");
const ALIMENTOS_DEMO = require("../Infraestructura/demo/alimentosDemo.json");

// Paciente de ejemplo para que el nutricionista pruebe la app sin armar todo
// desde cero: una paciente típica con la compra de una semana real en
// Ecuador (15 alimentos con información nutricional de USDA y de la tabla
// USFQ) que cubre su meta de calorías, proteínas, vitaminas y minerales.
//
// Presupuesto realista: la Canasta Familiar Básica de Consumo del INEC
// (julio 2026) destina $355,27 al mes a alimentos para un hogar de 4,
// ≈ $89 por persona al mes ≈ $20,50 a la semana. Precios de mercado 2026
// (pollo $1,40/lb, cubeta de huevos $4,10, arroz $1,44/kg); la compra
// completa cuesta ≈ $20,40.
const NOMBRE_DEMO = "María Demo (paciente de ejemplo)";

const DATOS_DEMO = {
  nombre: NOMBRE_DEMO,
  peso: 64,
  altura: 1.6,
  edad: 32,
  sexo: "femenino",
  objetivo: "Bajar Peso",
  nivelActividad: "Moderado",
  numeroComidas: 4,
  presupuesto: 21, // ≈ canasta del INEC por persona a la semana
  tiempoParaCocinar: 30,
  restricciones: "",
  preferencias: "Comida casera, platos sencillos",
  alergias: [],
  enfermedades: [],
};

class CrearPacienteDemo {
  constructor({ pacienteRepository, alimentoRepository }) {
    this.pacienteRepository = pacienteRepository;
    this.alimentoRepository = alimentoRepository;
  }

  // Devuelve el paciente creado, o null si ese nutricionista ya tiene uno
  async ejecutar(idNutriologo) {
    const existentes = await this.pacienteRepository.findAllByNutriologo(idNutriologo);
    if (existentes.some((p) => p.nombre === NOMBRE_DEMO)) return null;

    const paciente = await this.pacienteRepository.save(new Paciente({ ...DATOS_DEMO, idNutriologo }));
    for (const datos of ALIMENTOS_DEMO) {
      await this.alimentoRepository.save(new Alimento({ ...datos, idPaciente: paciente.id }));
    }
    return paciente;
  }
}

module.exports = CrearPacienteDemo;
module.exports.NOMBRE_DEMO = NOMBRE_DEMO;
module.exports.ALIMENTOS_DEMO = ALIMENTOS_DEMO;

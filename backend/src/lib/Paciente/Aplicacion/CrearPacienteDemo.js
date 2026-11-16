const Paciente = require("../Dominio/Entidades/Paciente");
const Alimento = require("../../Alimento/Dominio/Entidades/Alimento");
const ALIMENTOS_DEMO = require("../Infraestructura/demo/alimentosDemo.json");

// Paciente de ejemplo para que el nutricionista pruebe la app sin armar todo
// desde cero: datos de una paciente típica y 17 alimentos con su información
// nutricional ya verificada (USDA y tabla USFQ), suficientes para que el
// menú llegue a su meta de calorías y proteínas.
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
  presupuesto: 40,
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

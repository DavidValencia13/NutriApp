// Datos de demostración: cantidades y precios ficticios; composición consultada
// de la tabla USFQ que usa la propia API de búsqueda de NutriApp.
// Solo actúa sobre los tres pacientes cuyo nombre termina en "(Demo)".
// Se puede repetir sin duplicar alimentos ni sobrescribir fichas ya revisadas.
require("dotenv").config();

const { sequelize } = require("../src/Infraestructura/database/postgres");
const { connectMongo, disconnectMongo } = require("../src/Infraestructura/database/mongo");
const PacienteModel = require("../src/lib/Paciente/Infraestructura/PacienteModel");
const ReferenciaUSFQModel = require("../src/lib/Alimento/Infraestructura/ReferenciaUSFQModel");
const BuscadorNutricionalUSFQ = require("../src/lib/Alimento/Infraestructura/BuscadorNutricionalUSFQ");
const AlimentoRepositoryMongo = require("../src/lib/Alimento/Infraestructura/AlimentoRepositoryMongo");
const Alimento = require("../src/lib/Alimento/Dominio/Entidades/Alimento");
const EditarAlimento = require("../src/lib/Alimento/Aplicacion/EditarAlimento");

// El nombre de referencia se comprueba exactamente antes de guardar: una
// búsqueda parecida (p. ej. harina en vez de arveja seca) detiene la carga.
const FICHAS = {
  zapallo: "Zapallo, ayote, guico, calabaza, amarillo, maduro, crudo",
  arroz: "Arroz blanco, grano largo crudo",
  pollo: "Pollo, pechuga, con piel, cruda",
  arveja: "Arveja, grano seco, crudo",
  banano: "Banano, guineo, plátano seda",
  lenteja: "Lenteja, grano seco, crudo",
  leche: "Leche, de vaca, fluida, entera 3.25% grasa",
  huevo: "Huevo de gallina, entero, crudo",
  tomate: "Tomate, rojo, riñon, crudo, promedio",
  espinaca: "Espinaca, cruda",
  yuca: "Yuca, mandioca, raíz",
  frejol: "Fréjol, negro, grano seco, crudo",
  papaya: "Papaya, lechosa, madura, pulpa",
  quinua: "Quinua, cruda",
  tilapia: "Tilapia, fresca, cruda",
  naranja: "Naranja, dulce, común",
  avena: "Avena, hojuelas, sin fortificar, Mosh",
  aguacate: "Aguacate, sin cáscara, promedio",
};

const item = (nombre, ficha, cantidad, unidadMedida, precioTotal, gruposAlimenticios, extra = {}) =>
  ({ nombre, ficha, cantidad, unidadMedida, precioTotal, gruposAlimenticios, ...extra });

const DEMO = {
  "Ana Ruiz (Demo)": [
    item("Zapallo (calabaza)", "zapallo", 1.5, "kg", 2.4, ["verduras_hortalizas"], { anterior: [2, "g", 20, null] }),
    item("Arroz blanco", "arroz", 2, "kg", 3, ["granos_cereales"], { anterior: [1, "lb", 1, 97] }),
    item("Pechuga de pollo", "pollo", 2, "kg", 12, ["proteinas"], { anterior: [2, "g", 10, 1050] }),
    item("Arveja seca", "arveja", 1, "kg", 3, ["legumbres", "proteinas"], { anterior: [2, "l", 23, 116] }),
    item("Banano", "banano", 1, "kg", 1.6, ["frutas"], { anterior: [2, "unidad", 2, 371] }),
    item("Lenteja", "lenteja", 1, "kg", 3, ["legumbres", "proteinas"], { anterior: [2, "l", 4, 114] }),
    item("Huevo", "huevo", 12, "unidad", 3, ["proteinas"], { gramosPorPorcion: 50 }),
    item("Tomate", "tomate", 1, "kg", 1.5, ["verduras_hortalizas"]),
    item("Espinaca", "espinaca", 0.7, "kg", 1.4, ["verduras_hortalizas"]),
    item("Yuca", "yuca", 1, "kg", 1.8, ["carbohidratos"]),
    item("Papaya", "papaya", 1.5, "kg", 2.4, ["frutas"]),
    item("Leche entera", "leche", 2, "l", 3.2, ["lacteos"]),
    item("Fréjol negro", "frejol", 1, "kg", 3.3, ["legumbres", "proteinas"]),
    item("Tilapia", "tilapia", 1, "kg", 5, ["proteinas"]),
    item("Aguacate", "aguacate", 1.5, "kg", 4, ["grasas_saludables", "frutas"]),
  ],
  "Luis Torres (Demo)": [
    item("Pechuga de pollo", "pollo", 2.5, "kg", 15, ["proteinas"]),
    item("Tilapia", "tilapia", 1.5, "kg", 7.5, ["proteinas"]),
    item("Huevo", "huevo", 18, "unidad", 4.5, ["proteinas"], { gramosPorPorcion: 50 }),
    item("Arroz blanco", "arroz", 3, "kg", 4.5, ["granos_cereales"]),
    item("Avena", "avena", 1, "kg", 3, ["granos_cereales"]),
    item("Lenteja", "lenteja", 1.5, "kg", 4.5, ["legumbres", "proteinas"]),
    item("Fréjol negro", "frejol", 1.5, "kg", 4.5, ["legumbres", "proteinas"]),
    item("Leche entera", "leche", 3, "l", 4.8, ["lacteos"]),
    item("Banano", "banano", 2, "kg", 3.2, ["frutas"]),
    item("Tomate", "tomate", 1.5, "kg", 2.25, ["verduras_hortalizas"]),
    item("Espinaca", "espinaca", 1, "kg", 2, ["verduras_hortalizas"]),
    item("Yuca", "yuca", 2, "kg", 3.6, ["carbohidratos"]),
    item("Papaya", "papaya", 1.5, "kg", 2.4, ["frutas"]),
    item("Aguacate", "aguacate", 2, "kg", 5, ["grasas_saludables", "frutas"]),
  ],
  "Carla Vega (Demo)": [
    item("Lenteja", "lenteja", 1.5, "kg", 4.5, ["legumbres", "proteinas"]),
    item("Fréjol negro", "frejol", 1.5, "kg", 4.5, ["legumbres", "proteinas"]),
    item("Arveja seca", "arveja", 1, "kg", 3, ["legumbres", "proteinas"]),
    item("Quinua", "quinua", 1.5, "kg", 6, ["granos_cereales", "proteinas"]),
    item("Arroz blanco", "arroz", 2, "kg", 3, ["granos_cereales"]),
    item("Huevo", "huevo", 12, "unidad", 3, ["proteinas"], { gramosPorPorcion: 50 }),
    item("Tilapia", "tilapia", 1, "kg", 5, ["proteinas"]),
    item("Tomate", "tomate", 1.5, "kg", 2.25, ["verduras_hortalizas"]),
    item("Espinaca", "espinaca", 1, "kg", 2, ["verduras_hortalizas"]),
    item("Zapallo", "zapallo", 1.5, "kg", 2.4, ["verduras_hortalizas"]),
    item("Yuca", "yuca", 1.5, "kg", 2.7, ["carbohidratos"]),
    item("Papaya", "papaya", 1.5, "kg", 2.4, ["frutas"]),
    item("Naranja dulce", "naranja", 1.5, "kg", 2.25, ["frutas"]),
    item("Aguacate", "aguacate", 1.5, "kg", 4, ["grasas_saludables", "frutas"]),
    item("Leche entera", "leche", 2, "l", 3.2, ["lacteos"]),
  ],
};

async function main() {
  await sequelize.authenticate();
  await connectMongo();
  const buscador = new BuscadorNutricionalUSFQ(() => ReferenciaUSFQModel.find().lean());
  const repo = new AlimentoRepositoryMongo();
  const editar = new EditarAlimento(repo);
  const fichas = {};

  // Validar toda la composición antes de modificar cualquier alimento.
  for (const [clave, referencia] of Object.entries(FICHAS)) {
    const resultado = await buscador.buscar(referencia);
    if (resultado?.nombreEncontrado !== referencia || resultado?.calorias == null) {
      throw new Error(`No hay una ficha USFQ exacta para ${clave}. Ejecuta primero npm run cargar:usfq.`);
    }
    const nutrientes = Object.fromEntries(
      Alimento.CAMPOS_NUTRIENTES.filter((campo) => resultado[campo] != null)
        .map((campo) => [campo, resultado[campo]]),
    );
    fichas[clave] = {
      refUnidad: "g", refCantidad: 100, fuente: "USFQ",
      nombreReferencia: referencia, ...nutrientes,
    };
  }

  const pacientes = await PacienteModel.findAll({
    where: { nombre: Object.keys(DEMO) },
    attributes: ["id", "nombre", "presupuesto"],
  });
  for (const paciente of pacientes) {
    if (!paciente.nombre.endsWith("(Demo)")) continue;
    let creados = 0;
    let completados = 0;
    for (const alimento of DEMO[paciente.nombre]) {
      const existente = await repo.findByNombreAndPaciente(alimento.nombre, paciente.id);
      const [cantidadAnterior, unidadAnterior, totalAnterior, caloriasAnteriores] = alimento.anterior || [];
      const coincideEjemploViejo = existente && existente.cantidad === cantidadAnterior &&
        existente.unidadMedida === unidadAnterior &&
        Math.abs(existente.precio * existente.cantidad - totalAnterior) < 0.001 &&
        (caloriasAnteriores == null
          ? existente.infoNutricional?.calorias == null
          : existente.infoNutricional?.calorias === caloriasAnteriores);
      // El fixture antiguo tenía cantidades/unidades y valores nutricionales
      // de prueba que no correspondían a la tabla. Solo se repara si toda la
      // firma anterior coincide; cualquier edición posterior queda intacta.
      const tieneValores = Alimento.CAMPOS_NUTRIENTES.some(
        (campo) => existente?.infoNutricional?.[campo] != null,
      );
      if ((existente?.infoNutricional?.fuente || tieneValores) && !coincideEjemploViejo) continue;
      const infoNutricional = {
        ...fichas[alimento.ficha],
        ...(alimento.gramosPorPorcion ? { gramosPorPorcion: alimento.gramosPorPorcion } : {}),
      };
      if (existente) {
        await editar.ejecutar(existente.id, paciente.id, {
          infoNutricional,
          ...(coincideEjemploViejo ? {
            cantidad: alimento.cantidad,
            unidadMedida: alimento.unidadMedida,
            precio: alimento.precioTotal / alimento.cantidad,
          } : {}),
        });
        completados++;
        continue;
      }
      const nuevo = new Alimento({
        idPaciente: paciente.id,
        nombre: alimento.nombre,
        cantidad: alimento.cantidad,
        unidadMedida: alimento.unidadMedida,
        precio: alimento.precioTotal / alimento.cantidad,
        gruposAlimenticios: alimento.gruposAlimenticios,
        infoNutricional,
      });
      await repo.save(nuevo);
      creados++;
    }
    console.log(`${paciente.nombre}: ${creados} alimentos de ejemplo creados, ${completados} fichas completadas`);
  }
}

main().catch((error) => {
  console.error("No se pudo cargar la demostración:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  await disconnectMongo();
  await sequelize.close();
});

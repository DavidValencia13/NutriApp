// Revisión con IA de los alimentos registrados: verifica que la referencia
// nutricional (USDA/USFQ) corresponda al alimento que se compró, estima el
// peso de una unidad y completa la información nutricional que falte.
//   npm run revisar:alimentos             -> muestra lo que cambiaría
//   npm run revisar:alimentos -- --aplicar -> aplica los cambios
//   (opcional) --paciente=<id> para revisar uno solo
require("dotenv").config({ quiet: true });

const { connectPostgres } = require("../src/Infraestructura/database/postgres");
const { connectMongo, disconnectMongo } = require("../src/Infraestructura/database/mongo");
const PacienteModel = require("../src/lib/Paciente/Infraestructura/PacienteModel");
const AlimentoModel = require("../src/lib/Alimento/Infraestructura/AlimentoModel");
const ReferenciaUSFQModel = require("../src/lib/Alimento/Infraestructura/ReferenciaUSFQModel");
const BuscadorNutricionalUSDA = require("../src/lib/Alimento/Infraestructura/BuscadorNutricionalUSDA");
const BuscadorNutricionalUSFQ = require("../src/lib/Alimento/Infraestructura/BuscadorNutricionalUSFQ");
const BuscadorNutricionalCombinado = require("../src/lib/Alimento/Infraestructura/BuscadorNutricionalCombinado");
const { CAMPOS_NUTRIENTES } = require("../src/lib/Alimento/Dominio/Entidades/Alimento");
const { pedirCompletion } = require("../src/Infraestructura/ia/iaClient");

const APLICAR = process.argv.includes("--aplicar");
const SOLO_PACIENTE = Number((process.argv.find((a) => a.startsWith("--paciente=")) || "").split("=")[1]) || null;

function prompt(alimentos) {
  const lista = alimentos.map((a, i) => ({
    indice: i + 1,
    nombre: a.nombre,
    cantidadComprada: `${a.cantidad} ${a.unidadMedida}`,
    precioPorUnidadDeMedida: a.precio,
    referenciaNutricional: a.infoNutricional?.nombreReferencia || (a.infoNutricional ? "(sin nombre)" : "(sin información nutricional)"),
    gramosPorUnidadActual: a.unidadMedida === "unidad" ? a.infoNutricional?.gramosPorPorcion ?? null : undefined,
  }));
  return `Eres nutricionista en Ecuador. Revisa los alimentos que registró un paciente (nombre, cantidad comprada, precio en dólares y la referencia de la tabla nutricional que se usó):
${JSON.stringify(lista)}

Para cada alimento decide:
1. "referenciaCorrecta": true si la referencia nutricional corresponde al alimento que realmente se compró, considerando el nombre, el precio y cómo se vende en Ecuador (ej. "plátano" a $0.10 la unidad probablemente es guineo/banano; a $0.25 o más, plátano verde o maduro de cocinar). false si es otro alimento o si no tiene información nutricional.
2. "buscarComo": si referenciaCorrecta es false, el nombre genérico en español del alimento correcto para buscarlo en las tablas (ej. "guineo", "pechuga de pollo cruda"); si es true, null.
3. "gramosPorUnidad": solo para cantidades en "unidad": peso típico en gramos de la parte comestible de UNA unidad tal como se vende en Ecuador, según el precio (ej. un vasito de yogur ~150 g y una tarrina ~500 g; huevo 50; manzana 180; lata de atún escurrido 120). null si no se compra por unidad.
4. "motivo": una frase corta que explique tu decisión.

Responde SOLO un JSON: {"alimentos": [{"indice": 1, "referenciaCorrecta": true, "buscarComo": null, "gramosPorUnidad": null, "motivo": "..."}]}`;
}

async function main() {
  await connectPostgres();
  await connectMongo();
  const buscador = new BuscadorNutricionalCombinado({
    principal: new BuscadorNutricionalUSDA(pedirCompletion),
    secundario: new BuscadorNutricionalUSFQ(() => ReferenciaUSFQModel.find().lean()),
  });

  const pacientes = await PacienteModel.findAll({ where: SOLO_PACIENTE ? { id: SOLO_PACIENTE } : {}, order: [["id", "ASC"]] });
  for (const paciente of pacientes) {
    const alimentos = await AlimentoModel.find({ idPaciente: paciente.id }).lean();
    if (alimentos.length === 0) continue;
    console.log(`\n=== ${paciente.nombre} (${alimentos.length} alimentos)`);

    let revision;
    try {
      revision = JSON.parse(await pedirCompletion([{ role: "user", content: prompt(alimentos) }], { tarea: "revision" }));
    } catch (e) {
      console.log("   No se pudo revisar con la IA:", e.message);
      continue;
    }

    for (const r of revision.alimentos || []) {
      const a = alimentos[r.indice - 1];
      if (!a) continue;
      const cambios = {};
      const notas = [];

      if (!r.referenciaCorrecta && r.buscarComo) {
        let nuevo = null;
        try { nuevo = await buscador.buscar(r.buscarComo); } catch (e) { notas.push(`búsqueda falló: ${e.message}`); }
        if (nuevo) {
          const nutrientes = Object.fromEntries(CAMPOS_NUTRIENTES.filter((c) => nuevo[c] !== undefined).map((c) => [c, nuevo[c]]));
          cambios.infoNutricional = {
            refCantidad: 100,
            refUnidad: "g",
            ...(a.infoNutricional?.gramosPorPorcion && { gramosPorPorcion: a.infoNutricional.gramosPorPorcion }),
            fuente: nuevo.fuente,
            nombreReferencia: nuevo.nombreEncontrado,
            ...nutrientes,
          };
          notas.push(`referencia: «${a.infoNutricional?.nombreReferencia || "ninguna"}» → ${nuevo.fuente} «${nuevo.nombreEncontrado}» (${nuevo.calorias ?? "?"} kcal/100 g)`);
        } else {
          notas.push(`no se encontró «${r.buscarComo}» en las tablas`);
        }
      }

      const gramos = Number(r.gramosPorUnidad);
      const actual = a.infoNutricional?.gramosPorPorcion;
      if (a.unidadMedida === "unidad" && gramos > 0 && gramos !== actual) {
        cambios.infoNutricional = { ...(cambios.infoNutricional || a.infoNutricional || {}), gramosPorPorcion: Math.round(gramos) };
        notas.push(`peso por unidad: ${actual ?? "sin dato"} → ${Math.round(gramos)} g`);
      }

      const estado = notas.length ? (APLICAR ? "CAMBIADO" : "cambiaría") : "ok";
      console.log(`   ${a.nombre.padEnd(18)} ${estado}${notas.length ? ": " + notas.join("; ") : ""}\n   ${"".padEnd(18)} (${r.motivo})`);
      if (APLICAR && cambios.infoNutricional) {
        await AlimentoModel.updateOne({ _id: a._id }, { $set: { infoNutricional: cambios.infoNutricional } });
      }
    }
  }
  if (!APLICAR) console.log("\nModo revisión: no se cambió nada. Agrega --aplicar para guardar los cambios.");
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exitCode = 1; })
  .finally(async () => { await disconnectMongo(); process.exit(); });

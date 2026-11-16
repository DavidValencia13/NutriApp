const { isValidObjectId } = require("mongoose");
const { CAMPOS_NUTRIENTES } = require("../../Alimento/Dominio/Entidades/Alimento");
const { ValidationError, NotFoundError } = require("../Dominio/Errores");

const normalizar = (texto) => String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

class DiarioIngesta {
  constructor({ referenciaModel, registroRepository }) {
    this.referenciaModel = referenciaModel;
    this.registroRepository = registroRepository;
    this.referencias = null;
  }

  async buscarAlimentos(consulta) {
    const texto = String(consulta || "").trim();
    if (texto.length < 2) return [];
    if (texto.length > 80) throw new ValidationError("La búsqueda es demasiado larga");
    if (!this.referencias) {
      const rows = await this.referenciaModel.find().select("nombre unidadBase nutrientes.calorias").lean();
      if (rows.length) this.referencias = rows;
      else return [];
    }
    const termino = normalizar(texto);
    return this.referencias
      .filter((row) => normalizar(row.nombre).includes(termino))
      .sort((a, b) => {
        const prioridad = (row) => {
          const nombre = normalizar(row.nombre);
          const variantesEspecificas = ["materna", "infantil", "higado", "corazon", "molleja", "viscera", "hueso", "pata"];
          const procesos = ["polvo", "azucarad", "frit", "enlatad", "sabor", "chocolat", "galleta", "deshidratad"];
          const especial = variantesEspecificas.some((palabra) => nombre.includes(palabra) && !termino.includes(palabra)) ||
            (nombre.includes("con piel") && !termino.includes("piel"));
          const procesado = procesos.some((palabra) => nombre.includes(palabra) && !termino.includes(palabra));
          const basico = /\b(carne|pechuga|vaca|entera|fresco|cocido)\b/.test(nombre);
          return [nombre.startsWith(termino) ? 0 : 1, especial ? 1 : 0, procesado ? 1 : 0, basico ? 0 : 1, nombre.length];
        };
        const primero = prioridad(a);
        const segundo = prioridad(b);
        for (let i = 0; i < primero.length; i += 1) {
          if (primero[i] !== segundo[i]) return primero[i] - segundo[i];
        }
        return 0;
      })
      .slice(0, 12)
      .map((row) => ({
        id: String(row._id),
        nombre: row.nombre,
        unidad: row.unidadBase === "ml" ? "ml" : "g",
        caloriasPor100: row.nutrientes?.calorias ?? null,
      }));
  }

  async listar(idPaciente) {
    return this.registroRepository.listar(idPaciente);
  }

  async registrar(idPaciente, { idReferencia, cantidad, fecha }) {
    if (!isValidObjectId(idReferencia)) throw new ValidationError("Elige un alimento de las sugerencias");
    const cantidadNumero = Number(cantidad);
    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0 || cantidadNumero > 2000) {
      throw new ValidationError("La cantidad debe estar entre 0,01 y 2000 g o ml");
    }
    const fechaTexto = String(fecha || "");
    const fechaDate = new Date(`${fechaTexto}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto) ||
        !Number.isFinite(fechaDate.getTime()) || fechaDate.toISOString().slice(0, 10) !== fechaTexto) {
      throw new ValidationError("Ingresa una fecha válida");
    }

    const referencia = await this.referenciaModel.findById(idReferencia).lean();
    if (!referencia) throw new NotFoundError("El alimento ya no está disponible en la tabla nutricional");
    const nutrientes = {};
    for (const campo of CAMPOS_NUTRIENTES) {
      const valor = Number(referencia.nutrientes?.[campo]);
      if (referencia.nutrientes?.[campo] != null && Number.isFinite(valor)) {
        nutrientes[campo] = Math.round(valor * cantidadNumero) / 100;
      }
    }
    if (!Number.isFinite(nutrientes.calorias)) {
      throw new ValidationError("Este alimento no tiene calorías verificables en la tabla");
    }

    return this.registroRepository.guardar({
      idPaciente,
      fecha: fechaTexto,
      nombreAlimento: referencia.nombre,
      cantidad: cantidadNumero,
      unidad: referencia.unidadBase === "ml" ? "ml" : "g",
      fuente: "USFQ",
      nutrientes,
    });
  }

  async eliminar(idPaciente, idRegistro) {
    const id = Number(idRegistro);
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError("El registro no es válido");
    if (!await this.registroRepository.eliminar(idPaciente, id)) throw new NotFoundError("Registro no encontrado");
  }
}

module.exports = DiarioIngesta;

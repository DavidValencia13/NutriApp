const { NotFoundError, ValidationError, ServicioExternoError } = require("../Dominio/Errores");
const {
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
} = require("../Dominio/Servicios/CalculadoraNutricional");

class GenerarMenuSemanal {
  constructor({
    pacienteRepository,
    listarAlimentosPorPaciente,
    generadorMenuIA,
    menuRepository,
  }) {
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.generadorMenuIA = generadorMenuIA;
    this.menuRepository = menuRepository;
  }

  async ejecutar(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(idPaciente);
    if (alimentosDisponibles.length === 0)
      throw new ValidationError("El paciente no tiene alimentos registrados");
    this._validarCostoCatalogo(alimentosDisponibles, paciente);

    const perfilParaIA = {
      peso: paciente.peso,
      altura: paciente.altura,
      objetivo: paciente.objetivo,
      nivelActividad: paciente.nivelActividad,
      numeroComidas: paciente.numeroComidas,
      presupuesto: paciente.presupuesto,
      tiempoParaCocinar: paciente.tiempoParaCocinar,
      restricciones: paciente.restricciones,
      preferencias: paciente.preferencias,
    };

    const { diasPersistibles } = await this._generarConReintentos(
      perfilParaIA,
      alimentosDisponibles,
      paciente,
    );

    const menu = await this.menuRepository.ejecutarEnTransaccion(async (contextoPersistencia) => {
      const menuCreado = await this.menuRepository.crear(
        { idPaciente, estado: "generado" },
        diasPersistibles,
        { contextoPersistencia },
      );
      return menuCreado;
    });

    return menu;
  }

  // La IA a veces devuelve un menú con algún dato mal formado (cantidad poco
  // realista, presupuesto excedido) — es más útil reintentar una vez con una
  // generación nueva que hacer fallar el clic del nutriólogo por un solo
  // dato suelto. No se reintenta ante rate limit (429) ni timeout (504): ahí
  // el servicio ya está limitado o lento, y reintentar de inmediato no
  // ayuda (o empeora el rate limit).
  async _generarConReintentos(perfilParaIA, alimentosDisponibles, paciente) {
    const MAX_INTENTOS = 3;
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      try {
        const resultado = await this.generadorMenuIA.generar({
          perfilPaciente: perfilParaIA,
          alimentosDisponibles,
        });
        const diasPersistibles = this._construirDiasPersistibles(resultado, alimentosDisponibles);
        this._validarDisponibilidad(diasPersistibles, alimentosDisponibles);
        this._validarPresupuesto(diasPersistibles, paciente);
        return { resultado, diasPersistibles };
      } catch (error) {
        const esUltimoIntento = intento === MAX_INTENTOS;
        const noReintentable = error.statusCode === 429 || error.statusCode === 504;
        if (esUltimoIntento || noReintentable) throw error;
        console.error(`Intento ${intento} de generación de menú falló, reintentando:`, error.message);
      }
    }
  }

  // Resuelve cada "indiceAlimento" (posición 1-based en alimentosDisponibles,
  // ver GeneradorMenuGroq) contra el alimento real y arma el árbol listo
  // para persistir. El índice ya viene validado en rango por
  // GeneradorMenuGroq._validarForma, pero se revalida acá por si el
  // generador de IA inyectado (tests, u otro futuro) no lo garantiza.
  _construirDiasPersistibles(resultado, alimentosDisponibles) {
    return resultado.dias.map((dia) => {
      const comidas = dia.comidas.map((comida) => {
        const alimentos = comida.alimentos.map((detalle) => {
          const alimento = alimentosDisponibles[detalle.indiceAlimento - 1];
          if (!alimento) {
            throw new ServicioExternoError("El servicio de generación devolvió un menú inválido");
          }
          // Red de seguridad: si la IA ignoró la instrucción de usar
          // fracciones pequeñas en kg/l/lb (ej. puso "150" en vez de
          // "0.15" para kg), esa cantidad multiplicaría por mil el costo y
          // los nutrientes calculados. Mejor rechazar y reintentar que
          // persistir cifras absurdas sin que nadie lo note a tiempo.
          if (!cantidadEsPlausible(detalle.cantidad, alimento.unidadMedida)) {
            throw new ServicioExternoError(
              `El servicio de generación devolvió una cantidad poco realista para "${alimento.nombre}" (${detalle.cantidad} ${alimento.unidadMedida}). Intenta generar el menú de nuevo.`,
            );
          }
          const precioUnitario = alimento.precio || 0;
          return {
            idAlimento: alimento.id.toString(),
            nombreAlimento: alimento.nombre,
            unidadMedida: alimento.unidadMedida,
            cantidadUtilizada: detalle.cantidad,
            precioUnitario,
            costoTotal: precioUnitario * detalle.cantidad,
            nutrientes: calcularNutrientesDetalle(alimento, detalle.cantidad),
          };
        });
        return {
          orden: comida.orden,
          tipoComida: comida.tipoComida,
          nombrePlato: comida.nombrePlato,
          calorias: comida.calorias,
          costoTotal: alimentos.reduce((total, a) => total + a.costoTotal, 0),
          nutrientes: sumarNutrientes(alimentos.map((a) => a.nutrientes)),
          alimentos,
        };
      });
      return {
        numeroDia: dia.numeroDia,
        caloriasTotales: comidas.reduce((total, c) => total + c.calorias, 0),
        costoTotalDia: comidas.reduce((total, c) => total + c.costoTotal, 0),
        nutrientes: sumarNutrientes(comidas.map((c) => c.nutrientes)),
        comidas,
      };
    });
  }

  _validarCostoCatalogo(alimentosDisponibles, paciente) {
    if (!(paciente.presupuesto > 0)) return;
    const costoCatalogo = alimentosDisponibles.reduce(
      (total, alimento) =>
        total + Number(alimento.cantidad || 0) * Number(alimento.precio || 0),
      0,
    );
    if (costoCatalogo > paciente.presupuesto) {
      throw new ValidationError(
        `El costo de los alimentos registrados ($${costoCatalogo.toFixed(2)}) supera el presupuesto semanal ($${paciente.presupuesto.toFixed(2)}). Ajusta cantidades o precios antes de generar el menú.`,
      );
    }
  }

  _validarDisponibilidad(diasPersistibles, alimentosDisponibles) {
    const disponiblePorId = new Map(
      alimentosDisponibles.map((alimento) => [
        alimento.id.toString(),
        {
          nombre: alimento.nombre,
          cantidad: Number(alimento.cantidad),
          unidadMedida: alimento.unidadMedida,
        },
      ]),
    );
    const usadoPorId = new Map();

    for (const dia of diasPersistibles) {
      for (const comida of dia.comidas) {
        for (const detalle of comida.alimentos) {
          usadoPorId.set(
            detalle.idAlimento,
            (usadoPorId.get(detalle.idAlimento) || 0) +
              Number(detalle.cantidadUtilizada),
          );
        }
      }
    }

    for (const [idAlimento, cantidadUsada] of usadoPorId) {
      const disponible = disponiblePorId.get(idAlimento);
      if (disponible && cantidadUsada > disponible.cantidad + 1e-9) {
        throw new ServicioExternoError(
          `El menú requiere ${cantidadUsada.toFixed(2)} ${disponible.unidadMedida} de "${disponible.nombre}", pero solo hay ${disponible.cantidad} ${disponible.unidadMedida} registradas. Revisa la cantidad disponible antes de generar.`,
        );
      }
    }
  }

  // Red de seguridad de presupuesto: el prompt ya le pide a la IA no
  // excederlo, pero es una meta que a veces ignora. Acá el costo ya está
  // calculado con precios REALES (no estimados por la IA), así que se puede
  // verificar de verdad antes de persistir. 15% de margen porque "sin
  // excederlo demasiado" (instrucción del prompt) admite un poco de
  // holgura, no cero.
  _validarPresupuesto(diasPersistibles, paciente) {
    const MARGEN_PRESUPUESTO = 1.15;
    const costoTotalSemana = diasPersistibles.reduce((total, d) => total + d.costoTotalDia, 0);
    if (paciente.presupuesto > 0 && costoTotalSemana > paciente.presupuesto * MARGEN_PRESUPUESTO) {
      throw new ServicioExternoError(
        `El servicio de generación devolvió un menú que excede demasiado el presupuesto (costo: ${costoTotalSemana.toFixed(2)}$, presupuesto: ${paciente.presupuesto.toFixed(2)}$). Intenta generar el menú de nuevo.`,
      );
    }
  }
}

module.exports = GenerarMenuSemanal;

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
    registrarRecomendacion,
    generarAlertas,
  }) {
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.generadorMenuIA = generadorMenuIA;
    this.menuRepository = menuRepository;
    this.registrarRecomendacion = registrarRecomendacion;
    this.generarAlertas = generarAlertas;
  }

  async ejecutar(idPaciente, idNutriologo) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(idPaciente);
    if (alimentosDisponibles.length === 0)
      throw new ValidationError("El paciente no tiene alimentos registrados");

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

    const resultado = await this.generadorMenuIA.generar({
      perfilPaciente: perfilParaIA,
      alimentosDisponibles,
    });

    const alimentosPorId = new Map(alimentosDisponibles.map((a) => [a.id.toString(), a]));
    for (const dia of resultado.dias) {
      for (const comida of dia.comidas) {
        for (const detalle of comida.alimentos) {
          const alimento = alimentosPorId.get(detalle.idAlimento.toString());
          if (!alimento) {
            throw new ServicioExternoError("El servicio de generación devolvió un menú inválido");
          }
          // Red de seguridad: si la IA ignoró la instrucción de usar
          // fracciones pequeñas en kg/l/lb (ej. puso "150" en vez de
          // "0.15" para kg), esa cantidad multiplicaría por mil el costo y
          // los nutrientes calculados. Mejor rechazar y pedir reintentar
          // que persistir cifras absurdas sin que nadie lo note a tiempo.
          if (!cantidadEsPlausible(detalle.cantidad, alimento.unidadMedida)) {
            throw new ServicioExternoError(
              `El servicio de generación devolvió una cantidad poco realista para "${alimento.nombre}" (${detalle.cantidad} ${alimento.unidadMedida}). Intenta generar el menú de nuevo.`,
            );
          }
        }
      }
    }

    const diasPersistibles = resultado.dias.map((dia) => {
      const comidas = dia.comidas.map((comida) => {
        const alimentos = comida.alimentos.map((detalle) => {
          const alimento = alimentosPorId.get(detalle.idAlimento.toString());
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

    // Red de seguridad de presupuesto: el prompt ya le pide a la IA no
    // excederlo, pero es una meta que a veces ignora. Acá el costo ya está
    // calculado con precios REALES (no estimados por la IA), así que se
    // puede verificar de verdad antes de persistir. 15% de margen porque
    // "sin excederlo demasiado" (instrucción del prompt) admite un poco de
    // holgura, no cero.
    const costoTotalSemana = diasPersistibles.reduce((total, d) => total + d.costoTotalDia, 0);
    const MARGEN_PRESUPUESTO = 1.15;
    if (paciente.presupuesto > 0 && costoTotalSemana > paciente.presupuesto * MARGEN_PRESUPUESTO) {
      throw new ServicioExternoError(
        `El servicio de generación devolvió un menú que excede demasiado el presupuesto (costo: ${costoTotalSemana.toFixed(2)}$, presupuesto: ${paciente.presupuesto.toFixed(2)}$). Intenta generar el menú de nuevo.`,
      );
    }

    const menu = await this.menuRepository.ejecutarEnTransaccion(async (contextoPersistencia) => {
      const menuCreado = await this.menuRepository.crear(
        { idPaciente, estado: "generado" },
        diasPersistibles,
        { contextoPersistencia },
      );
      await this.registrarRecomendacion.ejecutar(
        { idPaciente, texto: resultado.recomendacion, fechaGeneracion: new Date() },
        { contextoPersistencia },
      );
      return menuCreado;
    });

    // Best-effort: si falla, no debe tumbar la generación del menú, que ya
    // se persistió. AprobarMenu vuelve a correr la evaluación de todos
    // modos como validación autoritativa antes de aprobar.
    try {
      await this.generarAlertas.ejecutar(menu.id);
    } catch (error) {
      console.error("No se pudieron generar alertas para el menú", menu.id, ":", error.message);
    }

    return menu;
  }
}

module.exports = GenerarMenuSemanal;

const { NotFoundError, ValidationError, ServicioExternoError } = require("../Dominio/Errores");

class GenerarMenuSemanal {
  constructor({ pacienteRepository, listarAlimentosPorPaciente, generadorMenuIA, menuRepository, registrarRecomendacion }) {
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.generadorMenuIA = generadorMenuIA;
    this.menuRepository = menuRepository;
    this.registrarRecomendacion = registrarRecomendacion;
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
          if (!alimentosPorId.has(detalle.idAlimento.toString())) {
            throw new ServicioExternoError("El servicio de generación devolvió un menú inválido");
          }
        }
      }
    }

    const diasPersistibles = resultado.dias.map((dia) => {
      const comidas = dia.comidas.map((comida) => ({
        orden: comida.orden,
        tipoComida: comida.tipoComida,
        calorias: comida.calorias,
        alimentos: comida.alimentos.map((detalle) => {
          const alimento = alimentosPorId.get(detalle.idAlimento.toString());
          return {
            idAlimento: alimento.id.toString(),
            nombreAlimento: alimento.nombre,
            unidadMedida: alimento.unidadMedida,
            cantidadUtilizada: detalle.cantidad,
          };
        }),
      }));
      return {
        numeroDia: dia.numeroDia,
        caloriasTotales: comidas.reduce((total, c) => total + c.calorias, 0),
        comidas,
      };
    });

    return await this.menuRepository.ejecutarEnTransaccion(async (contextoPersistencia) => {
      const menu = await this.menuRepository.crear(
        { idPaciente, estado: "generado" },
        diasPersistibles,
        { contextoPersistencia },
      );
      await this.registrarRecomendacion.ejecutar(
        { idPaciente, texto: resultado.recomendacion, fechaGeneracion: new Date() },
        { contextoPersistencia },
      );
      return menu;
    });
  }
}

module.exports = GenerarMenuSemanal;

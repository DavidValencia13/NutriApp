const { NotFoundError, ValidationError, ConflictError, ServicioExternoError } = require("../Dominio/Errores");
const {
  calcularNutrientesDetalle,
  sumarNutrientes,
  cantidadEsPlausible,
  caloriasDeComida,
  momentosDelDia,
  LIMITE_CANTIDAD_POR_UNIDAD,
} = require("../Dominio/Servicios/CalculadoraNutricional");
const { requerimientoCalorico } = require("../Dominio/Servicios/RequerimientoCalorico");
const { evaluar: evaluarCoberturaCatalogo } = require("../../Alimento/Dominio/Servicios/EvaluadorCoberturaCatalogo");

class GenerarMenuSemanal {
  constructor({
    pacienteRepository,
    listarAlimentosPorPaciente,
    generadorMenuIA,
    menuRepository,
    evaluarCobertura = evaluarCoberturaCatalogo,
    resumenPaciente14Dias = null,
  }) {
    this.pacienteRepository = pacienteRepository;
    this.listarAlimentosPorPaciente = listarAlimentosPorPaciente;
    this.generadorMenuIA = generadorMenuIA;
    this.menuRepository = menuRepository;
    this.evaluarCobertura = evaluarCobertura;
    this.resumenPaciente14Dias = resumenPaciente14Dias;
  }

  async ejecutar(idPaciente, idNutriologo, { confirmarNuevaVersion = false, idVersionActual = null } = {}) {
    const paciente = await this.pacienteRepository.findById(idPaciente);
    if (!paciente) throw new NotFoundError("Paciente no encontrado");
    if (paciente.idNutriologo !== idNutriologo) throw new NotFoundError("Paciente no encontrado");

    const versionAnterior = await this.menuRepository.obtenerUltimaVersionResumen(idPaciente);
    if (versionAnterior && !confirmarNuevaVersion) {
      throw new ConflictError("Ya existe un menú para este paciente. Revisa la versión actual y confirma la creación de una nueva propuesta.");
    }
    if (versionAnterior && Number(idVersionActual) !== Number(versionAnterior.id)) {
      throw new ConflictError("El menú cambió desde que abriste la confirmación. Actualiza la vista antes de crear otra propuesta.");
    }

    const alimentosDisponibles = await this.listarAlimentosPorPaciente.ejecutar(idPaciente);
    if (alimentosDisponibles.length === 0)
      throw new ValidationError("El paciente no tiene alimentos registrados");
    const cobertura = this.evaluarCobertura({ paciente, alimentos: alimentosDisponibles });
    const resumen = cobertura.resumen || {};
    const faltanGrupos = !Number.isInteger(resumen.esencialesCubiertos) ||
      !Number.isInteger(resumen.esencialesTotal) || resumen.esencialesTotal < 1 ||
      resumen.esencialesCubiertos !== resumen.esencialesTotal;
    const hayRecomendacionesPendientes = cobertura.alertas?.some((alerta) =>
      alerta.grupoSugerido || alerta.gruposSugeridos?.length > 0);
    const suficiencia = cobertura.suficiencia;
    const faltanDatos = suficiencia?.alimentosSinDatos?.length || suficiencia?.alimentosSinPeso?.length;
    if (!cobertura.listoParaMenu || faltanGrupos || hayRecomendacionesPendientes || faltanDatos) {
      throw new ValidationError("Completa los alimentos y sus datos nutricionales antes de generar el menú");
    }
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
      // Meta diaria calculada (Mifflin-St Jeor × actividad ± objetivo): sin
      // ella la IA elegía porciones demasiado pequeñas
      caloriasObjetivoDia: requerimientoCalorico(paciente),
    };
    if (this.resumenPaciente14Dias) {
      perfilParaIA.resumenUltimos14Dias = await this.resumenPaciente14Dias.ejecutar(idPaciente);
    }

    const { diasPersistibles } = await this._generarConReintentos(
      perfilParaIA,
      alimentosDisponibles,
      paciente,
    );

    const menu = await this.menuRepository.ejecutarEnTransaccion(async (contextoPersistencia) => {
      await this.menuRepository.bloquearPaciente(idPaciente, { contextoPersistencia });
      const versionActual = await this.menuRepository.obtenerUltimaVersionResumen(idPaciente, { contextoPersistencia });
      if (Number(versionActual?.id ?? 0) !== Number(versionAnterior?.id ?? 0)) {
        throw new ConflictError("El menú cambió mientras se generaba la propuesta. Actualiza la vista antes de intentarlo de nuevo.");
      }
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
    let correccionAnterior;
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      try {
        const resultado = await this.generadorMenuIA.generar({
          perfilPaciente: perfilParaIA,
          alimentosDisponibles,
          correccionAnterior,
        });
        // Primero se rechazan cantidades absurdas (ej. 150 kg: la IA confundió
        // la unidad); ajustarlas al inventario escondería ese error
        this._validarCantidadesPlausibles(resultado, alimentosDisponibles);
        this._ajustarAlInventario(resultado, alimentosDisponibles);
        this._ajustarCaloriasALaMeta(resultado, alimentosDisponibles, perfilParaIA.caloriasObjetivoDia);
        const diasPersistibles = this._construirDiasPersistibles(
          resultado,
          alimentosDisponibles,
          perfilParaIA.numeroComidas,
        );
        this._validarDisponibilidad(diasPersistibles, alimentosDisponibles);
        this._validarPresupuesto(diasPersistibles, paciente);
        return { resultado, diasPersistibles };
      } catch (error) {
        const esUltimoIntento = intento === MAX_INTENTOS;
        const noReintentable = [429, 503, 504].includes(error.statusCode);
        if (esUltimoIntento || noReintentable) throw error;
        // Se acumulan las correcciones: con solo la última, la IA arreglaba
        // un problema y volvía a cometer el del intento anterior
        correccionAnterior = correccionAnterior
          ? `${correccionAnterior} Además: ${error.message}`
          : error.message;
        console.error(`Intento ${intento} de generación de menú falló, reintentando:`, error.message);
      }
    }
  }

  _validarCantidadesPlausibles(resultado, alimentosDisponibles) {
    for (const dia of resultado.dias) {
      for (const comida of dia.comidas) {
        for (const detalle of comida.alimentos) {
          const alimento = alimentosDisponibles[detalle.indiceAlimento - 1];
          if (alimento && !cantidadEsPlausible(detalle.cantidad, alimento.unidadMedida)) {
            throw new ServicioExternoError(
              `El servicio de generación devolvió una cantidad poco realista para "${alimento.nombre}" (${detalle.cantidad} ${alimento.unidadMedida}). Intenta generar el menú de nuevo.`,
            );
          }
        }
      }
    }
  }

  // La IA arma bien los platos pero suma mal: a menudo se pasa un poco del
  // inventario de algún alimento en la semana (ej. 580 g de espinaca con
  // 500 g registrados). En vez de pedir otro menú (más tiempo y costo), se
  // reducen en proporción todas las porciones de ese alimento hasta que la
  // suma quepa. Los platos no cambian. Como _validarCostoCatalogo ya
  // garantiza que el inventario completo cabe en el presupuesto, un menú
  // dentro del inventario también queda dentro del presupuesto.
  // Las cantidades se redondean hacia abajo (enteros en g/ml, 0.05 en
  // unidades, 3 decimales en kg/l/lb). Solo se ajustan excesos pequeños: si
  // habría que reducir más de un 40% o alguna porción quedaría en 0 (el
  // plato perdería un ingrediente de su nombre), se pide otro menú a la IA
  // con la corrección exacta. Modifica `resultado` y devuelve los ajustes.
  _ajustarAlInventario(resultado, alimentosDisponibles) {
    const usado = new Map();
    for (const dia of resultado.dias) {
      for (const comida of dia.comidas) {
        for (const detalle of comida.alimentos) {
          usado.set(detalle.indiceAlimento, (usado.get(detalle.indiceAlimento) || 0) + Number(detalle.cantidad));
        }
      }
    }

    const ajustes = [];
    for (const [indice, cantidadUsada] of usado) {
      const alimento = alimentosDisponibles[indice - 1];
      if (!alimento) continue; // índice inválido: lo rechaza _construirDiasPersistibles
      const disponible = Number(alimento.cantidad);
      if (!(cantidadUsada > disponible + 1e-9)) continue;

      const factor = disponible / cantidadUsada;
      const redondear = redondeoHaciaAbajo(alimento.unidadMedida);
      const detalles = resultado.dias.flatMap((dia) =>
        dia.comidas.flatMap((comida) =>
          comida.alimentos.filter((detalle) => detalle.indiceAlimento === indice),
        ),
      );
      // Piezas (huevos, frutas): mejor quitar una unidad entera a las
      // porciones más grandes (3 huevos -> 2) que dejar "2.25 huevos"
      if (alimento.unidadMedida === "unidad" && factor >= FACTOR_MINIMO_AJUSTE &&
          quitarUnidadesEnteras(detalles, cantidadUsada - disponible)) {
        ajustes.push({ nombre: alimento.nombre, antes: cantidadUsada, disponible });
        continue;
      }
      if (factor < FACTOR_MINIMO_AJUSTE || detalles.some((d) => redondear(d.cantidad * factor) <= 0)) {
        throw new ServicioExternoError(
          `El menú usa ${+cantidadUsada.toFixed(3)} ${alimento.unidadMedida} de "${alimento.nombre}" en ${detalles.length} comidas, pero solo hay ${disponible} ${alimento.unidadMedida} para toda la semana. Úsalo en menos comidas o con porciones más pequeñas (máximo ${disponible} ${alimento.unidadMedida} sumando toda la semana).`,
        );
      }
      for (const detalle of detalles) detalle.cantidad = redondear(detalle.cantidad * factor);
      ajustes.push({ nombre: alimento.nombre, antes: cantidadUsada, disponible });
    }

    if (ajustes.length > 0) {
      console.log(
        "Menú ajustado al inventario:",
        ajustes.map((a) => `${a.nombre} ${a.antes.toFixed(2)} → ≤${a.disponible}`).join("; "),
      );
    }
    return ajustes;
  }

  // La IA diseña bien los platos pero estima mal las calorías (sin
  // razonamiento queda 10-30% lejos de la meta). Aquí se calculan las
  // calorías reales de cada día con las tablas USDA/USFQ y se escalan las
  // porciones de los alimentos por peso o volumen (arroz, pollo, lentejas,
  // leche...) hasta acercarse a la meta. No se tocan las piezas (huevos,
  // frutas) para no dejar "1.3 manzanas", ni los alimentos sin calorías.
  // Nunca se usa más de lo que queda en el inventario ni se pasa del límite
  // de una porción realista; el factor se limita a 0.6-1.8 para que el plato
  // siga siendo el mismo. Modifica `resultado` y devuelve el detalle por día.
  _ajustarCaloriasALaMeta(resultado, alimentosDisponibles, meta) {
    if (!(meta > 0)) return [];

    const sobrante = new Map(
      alimentosDisponibles.map((a, i) => [i + 1, Number(a.cantidad)]),
    );
    for (const dia of resultado.dias) {
      for (const comida of dia.comidas) {
        for (const d of comida.alimentos) {
          sobrante.set(d.indiceAlimento, (sobrante.get(d.indiceAlimento) ?? 0) - Number(d.cantidad));
        }
      }
    }

    const kcal = (detalle) => {
      const alimento = alimentosDisponibles[detalle.indiceAlimento - 1];
      return alimento ? calcularNutrientesDetalle(alimento, detalle.cantidad).nutrientes.calorias : undefined;
    };

    const informe = [];
    for (const dia of resultado.dias) {
      const detalles = dia.comidas.flatMap((c) => c.alimentos);
      if (detalles.some((d) => !Number.isFinite(kcal(d)))) continue; // datos incompletos: no se ajusta
      const total = detalles.reduce((s, d) => s + kcal(d), 0);
      if (Math.abs(meta - total) <= meta * TOLERANCIA_META) continue;

      const escalables = detalles.filter(
        (d) => alimentosDisponibles[d.indiceAlimento - 1].unidadMedida !== "unidad" && kcal(d) > 0,
      );
      const kcalEscalables = escalables.reduce((s, d) => s + kcal(d), 0);
      if (kcalEscalables <= 0) continue;

      const factor = Math.min(FACTOR_MAXIMO_CALORIAS, Math.max(FACTOR_MINIMO_CALORIAS, 1 + (meta - total) / kcalEscalables));
      for (const d of escalables) {
        const alimento = alimentosDisponibles[d.indiceAlimento - 1];
        const limite = LIMITE_CANTIDAD_POR_UNIDAD[alimento.unidadMedida] ?? Infinity;
        let nueva = Math.min(redondeoCercano(alimento.unidadMedida)(d.cantidad * factor), limite);
        const aumento = nueva - d.cantidad;
        const disponible = Math.max(0, sobrante.get(d.indiceAlimento) ?? 0);
        if (aumento > disponible) nueva = d.cantidad + redondeoHaciaAbajo(alimento.unidadMedida)(disponible);
        if (nueva <= 0) continue;
        sobrante.set(d.indiceAlimento, (sobrante.get(d.indiceAlimento) ?? 0) - (nueva - d.cantidad));
        d.cantidad = nueva;
      }
      // Si aún falta, se suman piezas enteras (un huevo, un guineo) a las
      // porciones por unidad que ya están en los platos del día, de a una y
      // mientras quede inventario y la pieza no haga pasar la meta
      let despues = detalles.reduce((s, d) => s + kcal(d), 0);
      const piezas = detalles
        .filter((d) => alimentosDisponibles[d.indiceAlimento - 1].unidadMedida === "unidad" && kcal(d) > 0)
        .map((d) => ({ d, kcalPieza: kcal({ ...d, cantidad: 1 }) }))
        .sort((a, b) => b.kcalPieza - a.kcalPieza);
      let agrego = true;
      while (meta - despues > meta * TOLERANCIA_META && agrego) {
        agrego = false;
        for (const { d, kcalPieza } of piezas) {
          const quedan = sobrante.get(d.indiceAlimento) ?? 0;
          const limite = LIMITE_CANTIDAD_POR_UNIDAD.unidad;
          if (quedan >= 1 && d.cantidad + 1 <= Math.min(limite, d.cantidad * 2) && despues + kcalPieza <= meta * (1 + TOLERANCIA_META)) {
            d.cantidad += 1;
            sobrante.set(d.indiceAlimento, quedan - 1);
            despues += kcalPieza;
            agrego = true;
            if (meta - despues <= meta * TOLERANCIA_META) break;
          }
        }
      }
      informe.push({ dia: dia.numeroDia, antes: Math.round(total), despues: Math.round(despues) });
    }

    if (informe.length > 0) {
      console.log(
        `Calorías ajustadas a la meta (${meta} kcal):`,
        informe.map((i) => `día ${i.dia} ${i.antes}→${i.despues}`).join(", "),
      );
    }
    return informe;
  }

  // Resuelve cada "indiceAlimento" (posición 1-based en alimentosDisponibles,
  // ver GeneradorMenuIA) contra el alimento real y arma el árbol listo
  // para persistir. El índice ya viene validado en rango por
  // GeneradorMenuIA._validarForma, pero se revalida acá por si el
  // generador de IA inyectado (tests, u otro futuro) no lo garantiza.
  _construirDiasPersistibles(resultado, alimentosDisponibles, numeroComidas) {
    const momentos = momentosDelDia(numeroComidas || resultado.dias[0]?.comidas.length || 1);
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
        const nutrientes = sumarNutrientes(alimentos.map((a) => a.nutrientes));
        return {
          orden: comida.orden,
          // El momento del día lo fija el sistema según el orden (la
          // merienda siempre después del almuerzo), no lo que diga la IA
          tipoComida: momentos[comida.orden - 1] || comida.tipoComida,
          nombrePlato: comida.nombrePlato,
          descripcion: comida.descripcion || null,
          // Calorías calculadas con las tablas USDA/USFQ; la estimación de
          // la IA solo si a algún alimento le falta el dato
          calorias: caloriasDeComida(nutrientes, comida.calorias),
          costoTotal: alimentos.reduce((total, a) => total + a.costoTotal, 0),
          nutrientes,
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
        const cantidadFaltante = cantidadUsada - disponible.cantidad;
        throw new ServicioExternoError(
          `El menú requiere ${cantidadUsada.toFixed(2)} ${disponible.unidadMedida} de "${disponible.nombre}", pero solo hay ${disponible.cantidad} ${disponible.unidadMedida} registradas. Faltan ${cantidadFaltante.toFixed(2)} ${disponible.unidadMedida}. Edita la cantidad disponible o vuelve a generar para que la IA reduzca sus porciones.`,
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

// Ajuste de calorías: se acepta ±5% de la meta y las porciones se escalan
// como mucho entre 0.6 y 1.8 veces (el plato sigue siendo el mismo)
const TOLERANCIA_META = 0.05;
const FACTOR_MINIMO_CALORIAS = 0.6;
const FACTOR_MAXIMO_CALORIAS = 1.8;

// Redondeo a cantidades "de cocina": de 5 en 5 g/ml, 5 g en kg, 10 ml en l
function redondeoCercano(unidadMedida) {
  const paso = { g: 5, ml: 5, kg: 0.005, l: 0.01, lb: 0.01 }[unidadMedida] ?? 0.01;
  return (cantidad) => Number((Math.round(cantidad / paso) * paso).toFixed(3));
}

// Por debajo de este factor (reducir más de un 40%) el plato cambiaría
// demasiado: se pide otro menú en vez de ajustar
const FACTOR_MINIMO_AJUSTE = 0.6;

// Quita de a 1 unidad a la porción más grande que tenga 2 o más hasta cubrir
// el exceso. Devuelve false (sin tocar nada) si no alcanza solo con eso.
function quitarUnidadesEnteras(detalles, exceso) {
  const cantidades = detalles.map((d) => d.cantidad);
  let restante = exceso;
  while (restante > 1e-9) {
    let mayor = -1;
    for (let i = 0; i < cantidades.length; i++) {
      if (cantidades[i] >= 2 && (mayor === -1 || cantidades[i] > cantidades[mayor])) mayor = i;
    }
    if (mayor === -1) return false;
    cantidades[mayor] -= 1;
    restante -= 1;
  }
  detalles.forEach((d, i) => (d.cantidad = cantidades[i]));
  return true;
}

function redondeoHaciaAbajo(unidadMedida) {
  // "unidad" en pasos de 0.05: hay porciones fraccionarias válidas (un trozo
  // de lechuga = 0.15 unidad); las piezas enteras se ajustan antes con
  // quitarUnidadesEnteras
  const paso = ["g", "ml"].includes(unidadMedida) ? 1 : unidadMedida === "unidad" ? 0.05 : 0.001;
  return (cantidad) => Number((Math.floor(cantidad / paso + 1e-9) * paso).toFixed(3));
}

module.exports = GenerarMenuSemanal;

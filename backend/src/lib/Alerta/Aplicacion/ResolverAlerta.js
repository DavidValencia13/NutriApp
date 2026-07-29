const { NotFoundError, ValidationError } = require("../Dominio/Errores");

const ESTADOS_RESOLUCION = ["aceptada", "corregida", "ignorada"];

// Caso de uso: el nutriólogo revisa una alerta y deja registrada su
// decisión (nunca "pendiente" de nuevo por esta vía) + una observación
// opcional. Esa decisión queda fija para este menú (ver
// AlertaRepositorySequelize.upsertPendiente).
class ResolverAlerta {
  constructor({ alertaRepository }) {
    this.alertaRepository = alertaRepository;
  }

  async ejecutar(idAlerta, idNutriologo, { estado, observacion }) {
    if (!ESTADOS_RESOLUCION.includes(estado))
      throw new ValidationError(`estado debe ser uno de: ${ESTADOS_RESOLUCION.join(", ")}`);

    const alerta = await this.alertaRepository.obtenerConPropietario(idAlerta, idNutriologo);
    if (!alerta) throw new NotFoundError("Alerta no encontrada");

    return await this.alertaRepository.resolver(idAlerta, { estado, observacion });
  }
}

module.exports = ResolverAlerta;

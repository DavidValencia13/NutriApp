const { NotFoundError } = require("../Dominio/Errores");
const { normalizarPreparacion, recortarPasosIA, necesitaPreparacion, conBebida } = require("../Dominio/Servicios/Preparacion");

// Explicación de preparación de los platos de un menú. La genera la IA solo
// cuando el nutricionista la pide, se guarda y él la puede corregir; el
// paciente ve la versión guardada (abrirla no gasta IA).
class ExplicarPreparacionMenu {
  constructor({ menuRepository, generadorPreparacion }) {
    this.menuRepository = menuRepository;
    this.generadorPreparacion = generadorPreparacion;
  }

  // Genera las que faltan (o todas con regenerar). idsComidas limita a esos
  // platos (el botón de cada comida pide solo la suya). Devuelve
  // { preparaciones: { [idComida]: preparacion }, generadas }
  async generar(idMenu, idNutriologo, { regenerar = false, idsComidas = null } = {}) {
    const propio = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!propio) throw new NotFoundError("Menú no encontrado");
    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const comidas = (menu?.dias || []).flatMap((dia) => dia.comidas || []);

    const elegidas = Array.isArray(idsComidas) ? new Set(idsComidas.map(Number)) : null;
    const pendientes = comidas.filter(
      (c) => (!elegidas || elegidas.has(Number(c.id))) && (regenerar || necesitaPreparacion(c)),
    );
    const preparaciones = {};
    if (pendientes.length > 0) {
      const crudas = await this.generadorPreparacion.generar(pendientes);
      for (const comida of pendientes) {
        let preparacion = null;
        try {
          preparacion = conBebida(normalizarPreparacion(recortarPasosIA(crudas[Number(comida.id)])), comida);
        } catch {
          preparacion = null; // un plato mal formado no tumba a los demás
        }
        if (preparacion) preparaciones[comida.id] = preparacion;
      }
      await this.menuRepository.guardarPreparaciones(preparaciones);
    }

    const todas = {};
    for (const c of comidas) {
      const p = preparaciones[c.id] || c.preparacion;
      if (p?.pasos?.length) todas[c.id] = p;
    }
    return { preparaciones: todas, generadas: Object.keys(preparaciones).length };
  }

  // Para menús ya aprobados sin explicación (p. ej. aprobados antes de esta
  // función): cuando el paciente abre su app se completan sin bloquearlo.
  // Un menú se intenta como máximo una vez cada 10 minutos, para no gastar IA
  // de más si falla.
  completarEnSegundoPlano(menu) {
    const comidas = (menu?.dias || []).flatMap((dia) => dia.comidas || []);
    if (!menu?.id || !comidas.some(necesitaPreparacion)) return false;
    this._intentos = this._intentos || new Map();
    const ultimo = this._intentos.get(menu.id);
    if (ultimo && Date.now() - ultimo < 10 * 60 * 1000) return false;
    this._intentos.set(menu.id, Date.now());
    this._completarFaltantes(menu.id).catch((error) =>
      console.error("No se pudo completar la preparación en segundo plano:", error.message),
    );
    return true;
  }

  async _completarFaltantes(idMenu) {
    const menu = await this.menuRepository.obtenerConDetallesPorId(idMenu);
    const pendientes = (menu?.dias || []).flatMap((dia) => dia.comidas || []).filter(necesitaPreparacion);
    if (pendientes.length === 0) return;
    const crudas = await this.generadorPreparacion.generar(pendientes);
    const preparaciones = {};
    for (const comida of pendientes) {
      try {
        const p = conBebida(normalizarPreparacion(recortarPasosIA(crudas[Number(comida.id)])), comida);
        if (p) preparaciones[comida.id] = p;
      } catch {
        // un plato mal formado no tumba a los demás
      }
    }
    await this.menuRepository.guardarPreparaciones(preparaciones);
  }

  // El nutricionista corrige (o quita, con null) la explicación de un plato
  async editar(idComidaMenu, idNutriologo, preparacion) {
    const comida = await this.menuRepository.obtenerComidaConPropietario(idComidaMenu, idNutriologo);
    if (!comida) throw new NotFoundError("Comida no encontrada");
    // La corrección del nutricionista conserva la marca de la bebida (si no,
    // se volvería a generar y se perdería lo que corrigió)
    const normalizada = conBebida(normalizarPreparacion(preparacion), comida);
    await this.menuRepository.guardarPreparaciones({ [idComidaMenu]: normalizada });
    return { idComidaMenu, preparacion: normalizada };
  }
}

module.exports = ExplicarPreparacionMenu;

const { NotFoundError, AlertasCriticasError } = require("../Dominio/Errores");

// RF punto 6: antes de aprobar (finalizar) una dieta, corre una validación
// completa. Alertas críticas pendientes bloquean la aprobación por completo;
// advertencias pendientes la permiten pero exigen confirmación explícita
// (confirmarAdvertencias: true) — así el nutriólogo siempre tiene la
// decisión final, nunca se aprueba "a ciegas".
class AprobarMenu {
  constructor({ menuRepository, generarAlertas }) {
    this.menuRepository = menuRepository;
    this.generarAlertas = generarAlertas;
  }

  async ejecutar(idMenu, idNutriologo, { confirmarAdvertencias } = {}) {
    const menu = await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo);
    if (!menu) throw new NotFoundError("Menú no encontrado");
    if (menu.estado === "aprobado") return { menu, requiereConfirmacion: false };

    // Autoritativo: se recalculan las alertas aquí mismo, sin confiar en que
    // la última generación/ajuste haya corrido con éxito (esas llamadas son
    // best-effort, ver GenerarMenuSemanal/AjustarComidaMenu).
    const alertas = await this.generarAlertas.ejecutar(idMenu);

    const criticasPendientes = alertas.filter(
      (a) => a.nivel === "critica" && a.estado === "pendiente",
    );
    if (criticasPendientes.length > 0) {
      throw new AlertasCriticasError(criticasPendientes);
    }

    const advertenciasPendientes = alertas.filter(
      (a) => a.nivel === "advertencia" && a.estado === "pendiente",
    );
    if (advertenciasPendientes.length > 0 && !confirmarAdvertencias) {
      return { menu, requiereConfirmacion: true, advertencias: advertenciasPendientes };
    }

    const aprobado = await this.menuRepository.aprobar(idMenu);
    const menuFinal =
      aprobado || (await this.menuRepository.obtenerMenuConPropietario(idMenu, idNutriologo));
    return { menu: menuFinal, requiereConfirmacion: false };
  }
}

module.exports = AprobarMenu;

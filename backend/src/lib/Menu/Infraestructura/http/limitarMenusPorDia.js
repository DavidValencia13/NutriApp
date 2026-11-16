// Límite de menús generados por nutriólogo en las últimas 24 horas
// (MENUS_POR_DIA, 10 por defecto; 0 = sin límite). Cada menú gasta créditos
// de IA: así nadie se pasa del gasto, ni siquiera sin querer.
const LIMITE_POR_DEFECTO = 10;

function limiteConfigurado() {
  const valor = process.env.MENUS_POR_DIA;
  if (valor === undefined || valor === "") return LIMITE_POR_DEFECTO;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 ? n : LIMITE_POR_DEFECTO;
}

module.exports = (menuRepository, limite = limiteConfigurado()) => async (req, res, next) => {
  try {
    if (limite === 0) return next();
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const generados = await menuRepository.contarGeneradosPorNutriologoDesde(req.nutriologo.id, desde);
    if (generados >= limite) {
      return res.status(429).json({
        message: `Llegaste al límite de ${limite} menús generados en 24 horas. Podrás generar más mañana; mientras tanto puedes ajustar y aprobar los menús ya generados.`,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

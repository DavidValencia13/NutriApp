// Cumplimiento del menú a partir de lo que marca el paciente en cada comida.
// Comida completa = 1 punto, una parte = 0.5, no la comió = 0; el porcentaje
// se calcula solo sobre las comidas que ya marcó (las que no marcó no cuentan
// como incumplidas: puede que todavía no llegue ese día).

const PUNTOS = { si: 1, parte: 0.5, no: 0 };

function nivelDeCumplimiento(porcentaje) {
  if (porcentaje === null || porcentaje === undefined) return null;
  if (porcentaje >= 80) return "bien";
  if (porcentaje >= 50) return "regular";
  return "mal";
}

function resumenCumplimiento(menu, marcas) {
  const marcaPorComida = new Map((marcas || []).map((m) => [Number(m.idComidaMenu), m]));
  const dias = menu?.dias || [];

  // Momentos en el orden en que aparecen en el menú (Desayuno, Almuerzo...)
  const momentos = [];
  for (const dia of dias) {
    for (const c of dia.comidas || []) if (!momentos.includes(c.tipoComida)) momentos.push(c.tipoComida);
  }

  let puntos = 0;
  let marcadas = 0;
  let totales = 0;
  const saltosPorMomento = new Map();
  const notas = [];

  const grilla = momentos.map((momento) => ({
    momento,
    dias: dias.map((dia) => {
      const comida = (dia.comidas || []).find((c) => c.tipoComida === momento);
      if (!comida) return { numeroDia: dia.numeroDia, estado: null };
      totales += 1;
      const marca = marcaPorComida.get(Number(comida.id));
      if (marca) {
        marcadas += 1;
        puntos += PUNTOS[marca.estado] ?? 0;
        if (marca.estado !== "si") saltosPorMomento.set(momento, (saltosPorMomento.get(momento) || 0) + 1);
        if (marca.nota) {
          notas.push({ numeroDia: dia.numeroDia, tipoComida: momento, nombrePlato: comida.nombrePlato, estado: marca.estado, nota: marca.nota });
        }
      }
      return { numeroDia: dia.numeroDia, idComidaMenu: comida.id, estado: marca?.estado ?? null };
    }),
  }));

  const porcentaje = marcadas > 0 ? Math.round((puntos / marcadas) * 100) : null;
  const comidasQueMasSalta = [...saltosPorMomento.entries()]
    .map(([momento, veces]) => ({ momento, veces }))
    .sort((a, b) => b.veces - a.veces);

  return {
    porcentaje,
    nivel: nivelDeCumplimiento(porcentaje),
    comidasMarcadas: marcadas,
    comidasTotales: totales,
    grilla,
    comidasQueMasSalta,
    notas,
  };
}

module.exports = { resumenCumplimiento, nivelDeCumplimiento, PUNTOS };

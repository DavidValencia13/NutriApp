// Agrega una lista de RegistroCumplimiento en un resumen accionable para el
// nutriólogo. Función pura: no consulta nada, recibe ya resueltos los
// registros y un mapa idDiaMenu -> total de comidas planeadas ese día (del
// árbol del menú), porque una comida no marcada ni como consumida ni como
// omitida se trata como "no consumida" (conservador: incentiva registrar
// completo en vez de inflar el cumplimiento por omisión de datos).
function calcularResumen(registros, totalComidasPorDia) {
  if (!registros || registros.length === 0) {
    return {
      totalRegistros: 0,
      porcentajeCumplimiento: null,
      totalComidasConsumidas: 0,
      totalComidasPlaneadas: 0,
      promedioAgua: undefined,
      promedioNivelHambre: undefined,
      promedioNivelEnergia: undefined,
      sintomasReportados: [],
    };
  }

  let totalComidasConsumidas = 0;
  let totalComidasPlaneadas = 0;
  let sumaAgua = 0;
  let cuentaAgua = 0;
  let sumaHambre = 0;
  let cuentaHambre = 0;
  let sumaEnergia = 0;
  let cuentaEnergia = 0;
  const sintomas = new Set();

  for (const registro of registros) {
    totalComidasConsumidas += registro.comidasConsumidas.length;
    totalComidasPlaneadas += totalComidasPorDia.get(registro.idDiaMenu) || 0;

    if (registro.cantidadAgua !== undefined) {
      sumaAgua += registro.cantidadAgua;
      cuentaAgua += 1;
    }
    if (registro.nivelHambre !== undefined) {
      sumaHambre += registro.nivelHambre;
      cuentaHambre += 1;
    }
    if (registro.nivelEnergia !== undefined) {
      sumaEnergia += registro.nivelEnergia;
      cuentaEnergia += 1;
    }
    for (const sintoma of registro.sintomas || []) sintomas.add(sintoma);
  }

  return {
    totalRegistros: registros.length,
    porcentajeCumplimiento:
      totalComidasPlaneadas > 0
        ? Math.round((totalComidasConsumidas / totalComidasPlaneadas) * 100)
        : null,
    totalComidasConsumidas,
    totalComidasPlaneadas,
    promedioAgua: cuentaAgua > 0 ? sumaAgua / cuentaAgua : undefined,
    promedioNivelHambre: cuentaHambre > 0 ? sumaHambre / cuentaHambre : undefined,
    promedioNivelEnergia: cuentaEnergia > 0 ? sumaEnergia / cuentaEnergia : undefined,
    sintomasReportados: [...sintomas],
  };
}

module.exports = { calcularResumen };

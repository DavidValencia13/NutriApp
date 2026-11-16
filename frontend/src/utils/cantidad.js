// Cantidad legible: kg y l se muestran en g y ml ("0.25 l" -> "250 ml"),
// sin decimales sobrantes ("1.00" -> "1")
export function cantidadLegible(cantidad, unidad) {
  const n = Number(cantidad);
  const formato = (valor) => String(Math.round(valor * 100) / 100);
  if (unidad === "kg") return n >= 1 ? `${formato(n)} kg` : `${formato(n * 1000)} g`;
  if (unidad === "l") return n >= 1 ? `${formato(n)} l` : `${formato(n * 1000)} ml`;
  if (unidad === "unidad") return formato(n);
  return `${formato(n)} ${unidad}`;
}

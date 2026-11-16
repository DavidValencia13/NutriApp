export function ordenarControles(a, b) {
  const diferenciaFecha = new Date(a.fecha) - new Date(b.fecha);
  return diferenciaFecha || Number(a.id ?? 0) - Number(b.id ?? 0);
}

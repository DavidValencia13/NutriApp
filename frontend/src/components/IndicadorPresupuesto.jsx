function moneda(valor) {
  return Number(valor || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function IndicadorPresupuesto({ costo, presupuesto, titulo = "Presupuesto del catálogo" }) {
  const limite = Number(presupuesto);
  if (!(limite > 0)) return null;

  const actual = Number(costo) || 0;
  const porcentaje = (actual / limite) * 100;
  const excedido = actual > limite;
  const cercano = !excedido && porcentaje >= 80;
  const color = excedido
    ? "bg-nutri-pink"
    : cercano
      ? "bg-nutri-orange"
      : "bg-nutri-teal";
  const texto = excedido
    ? `Excede el presupuesto por ${moneda(actual - limite)}.`
    : cercano
      ? `Quedan ${moneda(limite - actual)}. Estás cerca del límite.`
      : `Disponible: ${moneda(limite - actual)}.`;

  return (
    <div
      className={`rounded-lg border p-3 ${
        excedido
          ? "border-nutri-pink/30 bg-nutri-pink/5"
          : cercano
            ? "border-nutri-orange/30 bg-nutri-orange/5"
            : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-nutri-navy">{titulo}</span>
        <span className="font-semibold tabular-nums text-nutri-navy">
          {moneda(actual)} / {moneda(limite)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
      <p
        className={`mt-1.5 text-[11px] ${
          excedido
            ? "font-medium text-nutri-pink"
            : cercano
              ? "font-medium text-nutri-orange"
              : "text-gray-500"
        }`}
      >
        {texto}
      </p>
    </div>
  );
}

export default IndicadorPresupuesto;

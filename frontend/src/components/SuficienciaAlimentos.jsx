// ¿Alcanzan las cantidades registradas para una semana de lo que necesita el
// paciente? Muestra calorías y proteínas disponibles por día frente a su
// requerimiento (lo calcula el backend en la cobertura del catálogo).

import { faltanAlimentos, UMBRAL_SUFICIENTE as UMBRAL_OK } from "../utils/suficiencia";

const UMBRAL_CRITICO = 75;

function estado(porcentaje) {
  if (porcentaje === null || porcentaje === undefined) return "sin-dato";
  if (porcentaje >= UMBRAL_OK) return "ok";
  return porcentaje < UMBRAL_CRITICO ? "critico" : "advertencia";
}

const COLOR = {
  ok: { barra: "bg-nutri-green", texto: "text-nutri-green" },
  advertencia: { barra: "bg-nutri-orange", texto: "text-nutri-orange" },
  critico: { barra: "bg-nutri-pink", texto: "text-nutri-pink" },
  "sin-dato": { barra: "bg-gray-300", texto: "text-gray-500" },
};

function Barra({ etiqueta, indicador, unidad }) {
  if (!indicador || indicador.requeridoDia === null) return null;
  const e = estado(indicador.porcentaje);
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-gray-600">{etiqueta}</span>
        <span className={`font-semibold tabular ${COLOR[e].texto}`}>
          {indicador.disponibleDia} / {indicador.requeridoDia} {unidad} por día ·{" "}
          {indicador.porcentaje >= 100
            ? `Alcanza ✓ (sobran ${indicador.disponibleDia - indicador.requeridoDia} ${unidad})`
            : `${indicador.porcentaje}%`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${COLOR[e].barra}`} style={{ width: `${Math.min(100, indicador.porcentaje)}%` }} />
      </div>
    </div>
  );
}

// Vitaminas, minerales y fibra: una línea si todo alcanza; si no, qué falta
// y qué alimentos registrar para cubrirlo
function Micronutrientes({ lista }) {
  if (!lista?.length) return null;
  const faltantes = lista.filter((m) => !m.suficiente);
  if (faltantes.length === 0) {
    return (
      <p className="text-xs text-nutri-green mt-2.5">
        <span className="font-semibold">Vitaminas y minerales: cubiertos ✓</span>{" "}
        <span className="text-gray-500">({lista.map((m) => m.label).join(", ")})</span>
      </p>
    );
  }
  return (
    <div className="mt-2.5 space-y-1">
      <p className="text-xs font-semibold text-nutri-ink">Falta registrar alimentos con:</p>
      {faltantes.map((m) => (
        <p key={m.campo} className="text-xs text-nutri-orange flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-nutri-orange shrink-0 mt-1.5" />
          <span>
            <span className="font-semibold">{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</span>{" "}
            (cubre {m.porcentaje}% de lo recomendado): {m.sugerencia}.
          </span>
        </p>
      ))}
    </div>
  );
}

function SuficienciaAlimentos({ suficiencia, titulo = "¿Alcanzan los alimentos para una semana?" }) {
  if (!suficiencia?.calorias || suficiencia.calorias.requeridoDia === null) return null;
  const falta = faltanAlimentos(suficiencia);
  return (
    <div className={`rounded-lg border p-3 ${falta ? "border-nutri-orange/30 bg-nutri-orange/5" : "border-nutri-green/30 bg-nutri-green/5"}`}>
      <p className="text-xs font-semibold text-nutri-ink mb-2">{titulo}</p>
      <div className="space-y-2">
        <Barra etiqueta="Calorías" indicador={suficiencia.calorias} unidad="kcal" />
        <Barra etiqueta="Proteínas" indicador={suficiencia.proteinas} unidad="g" />
      </div>
      <Micronutrientes lista={suficiencia.micronutrientes} />
      <p className={`text-xs mt-2 ${falta ? "text-nutri-orange" : "text-nutri-green"}`}>
        {falta
          ? `Faltan alimentos o cantidad: el menú no podrá llegar a la meta del paciente.${suficiencia.calorias.faltaSemana > 0 ? ` Faltan unas ${suficiencia.calorias.faltaSemana} kcal para la semana.` : ""}`
          : "Las cantidades registradas alcanzan para cubrir la semana del paciente."}
      </p>
    </div>
  );
}

export default SuficienciaAlimentos;

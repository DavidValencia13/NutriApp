import { ordenarControles } from "../utils/ordenarControles";

function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-EC", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
}

function pesoTexto(peso) {
  return Number(peso).toFixed(1).replace(".", ",");
}

export default function PesoTrendChart({ registros, id, compacto = false }) {
  const controles = (Array.isArray(registros) ? registros : [])
    .filter((registro) => Number.isFinite(Number(registro.peso)) && Number(registro.peso) > 0)
    .sort(ordenarControles);
  const ultimoPorDia = new Map();
  for (const control of controles) {
    ultimoPorDia.set(new Date(control.fecha).toISOString().slice(0, 10), control);
  }
  const mismoDia = ultimoPorDia.size === 1;
  const datos = mismoDia ? controles : [...ultimoPorDia.values()];

  if (datos.length < 2) return null;

  const minimo = Math.min(...datos.map((dato) => Number(dato.peso)));
  const maximo = Math.max(...datos.map((dato) => Number(dato.peso)));
  const margen = Math.max((maximo - minimo) * 0.18, 0.35);
  const inferior = minimo - margen;
  const superior = maximo + margen;
  const tiempos = datos.map((dato) => new Date(dato.fecha).getTime());
  const duracion = tiempos.at(-1) - tiempos[0];
  const puntos = datos.map((dato, indice) => ({
    x: 38 + (!mismoDia && duracion > 0 ? (tiempos[indice] - tiempos[0]) / duracion : indice / (datos.length - 1)) * 266,
    y: 83 - ((Number(dato.peso) - inferior) / (superior - inferior)) * 66,
  }));
  const indicesFecha = datos.length <= 4
    ? datos.map((_, indice) => indice)
    : [0, Math.floor((datos.length - 1) / 2), datos.length - 1];
  const gradiente = `peso-area-${id}`;
  const gradienteLinea = `peso-linea-${id}`;
  const linea = puntos.map((punto) => `${punto.x},${punto.y}`).join(" ");

  return (
    <div className={`weight-chart-frame${compacto ? " weight-chart-frame-compact" : ""}`}>
      <svg className="weight-chart" viewBox="0 0 320 118" role="img"
        aria-label={mismoDia
          ? `Cambio entre ${datos.length} controles del ${fechaCorta(datos[0].fecha)}: ${pesoTexto(datos[0].peso)} kg al inicio y ${pesoTexto(datos.at(-1).peso)} kg al final`
          : `Evolución del peso: ${pesoTexto(datos[0].peso)} kg el ${fechaCorta(datos[0].fecha)}; ${pesoTexto(datos.at(-1).peso)} kg el ${fechaCorta(datos.at(-1).fecha)}`}>
        <defs>
          <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#46cfa3" stopOpacity=".28" />
            <stop offset="1" stopColor="#46cfa3" stopOpacity=".02" />
          </linearGradient>
          <linearGradient id={gradienteLinea} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#10bf83" />
            <stop offset="1" stopColor="#328fd6" />
          </linearGradient>
        </defs>
        {[20, 51, 83].map((y) => <line key={y} x1="38" x2="304" y1={y} y2={y} className="weight-chart-grid" />)}
        <text x="31" y="23" textAnchor="end" className="weight-chart-scale">{pesoTexto(maximo)}</text>
        <text x="31" y="86" textAnchor="end" className="weight-chart-scale">{pesoTexto(minimo)}</text>
        <polygon points={`38,83 ${linea} 304,83`} fill={`url(#${gradiente})`} />
        <polyline className="weight-trend-line" points={linea} pathLength="1" fill="none" stroke={`url(#${gradienteLinea})`} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="weight-chart-current-halo" cx={puntos.at(-1).x} cy={puntos.at(-1).y} r="8" fill="#70cde9" fillOpacity=".25" />
        {puntos.map((punto, indice) => <circle key={`${datos[indice].fecha}-${indice}`} cx={punto.x} cy={punto.y}
          r={indice === puntos.length - 1 ? "4.6" : "3.5"} fill="#fff" stroke={indice === puntos.length - 1 ? "#328fd6" : "#0fae81"} strokeWidth="2">
          <title>{`${fechaCorta(datos[indice].fecha)} · ${mismoDia ? `control ${indice + 1} · ` : ""}${pesoTexto(datos[indice].peso)} kg`}</title>
        </circle>)}
        {indicesFecha.map((indice) => <text key={indice} x={puntos[indice].x} y="110"
          textAnchor={indice === 0 ? "start" : indice === datos.length - 1 ? "end" : "middle"}
          className="weight-chart-date">{mismoDia ? `Control ${indice + 1}` : fechaCorta(datos[indice].fecha)}</text>)}
      </svg>
    </div>
  );
}

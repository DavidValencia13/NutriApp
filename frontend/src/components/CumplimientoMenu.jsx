import { useEffect, useState } from "react";
import { Check, ChartPie, MessageSquareText, Smartphone, X } from "lucide-react";
import { obtenerCumplimientoPaciente } from "../services/portalService";

// Lo que el paciente marcó en la app sobre su menú aprobado: cumplimiento,
// calendario comida por comida, qué se salta y sus comentarios
const ESTILO = {
  si: { clase: "bg-nutri-green text-white", Icono: Check, texto: "La comió" },
  parte: { clase: "bg-nutri-orange text-white", Icono: ChartPie, texto: "Una parte" },
  no: { clase: "bg-nutri-pink text-white", Icono: X, texto: "No la comió" },
};

function colorPorcentaje(p) {
  if (p >= 80) return { barra: "bg-nutri-green", texto: "text-nutri-green" };
  if (p >= 50) return { barra: "bg-nutri-orange", texto: "text-nutri-orange" };
  return { barra: "bg-nutri-pink", texto: "text-nutri-pink" };
}

function CumplimientoMenu({ idPaciente, version }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    obtenerCumplimientoPaciente(idPaciente).then(setDatos).catch(() => setDatos({ error: true }));
  }, [idPaciente, version]);

  if (!datos) return <div className="esqueleto h-40 rounded-lg mb-5" />;
  if (datos.error) return null;

  if (!datos.tieneAcceso || !datos.resumen) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 mb-5 text-sm text-gray-600">
        <Smartphone size={18} className="shrink-0 mt-0.5 text-nutri-brand" />
        <p>
          {!datos.tieneAcceso
            ? "Dale acceso desde Más opciones → Acceso a la app. El paciente podrá registrar alimentos y peso; al aprobar un menú también podrá marcar sus comidas."
            : "El paciente ya puede registrar alimentos y peso. Cuando apruebes su menú, aquí verás qué comidas va cumpliendo."}
        </p>
      </div>
    );
  }

  const r = datos.resumen;
  const color = r.porcentaje !== null ? colorPorcentaje(r.porcentaje) : null;

  return (
    <section className="rounded-xl border border-line p-4 mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Cumplimiento del menú aprobado (lo marca el paciente)</p>
          <p className={`text-2xl font-semibold tabular mt-0.5 ${color?.texto || "text-gray-400"}`}>
            {r.porcentaje === null ? "Sin registros aún" : `${r.porcentaje}%`}
          </p>
        </div>
        <p className="text-xs text-gray-500 text-right">
          {r.comidasMarcadas} de {r.comidasTotales}
          <br />
          comidas registradas
        </p>
      </div>
      {color && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-2">
          <div className={`h-full rounded-full ${color.barra}`} style={{ width: `${r.porcentaje}%` }} />
        </div>
      )}

      {/* Calendario: filas = momentos del día, columnas = días */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left font-medium pb-1.5 pr-2">Comida</th>
              {r.grilla[0]?.dias.map((d) => (
                <th key={d.numeroDia} className="font-medium pb-1.5 px-0.5">
                  D{d.numeroDia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.grilla.map((fila) => (
              <tr key={fila.momento}>
                <td className="pr-2 py-1 text-gray-600 whitespace-nowrap">{fila.momento}</td>
                {fila.dias.map((d) => {
                  const e = d.estado ? ESTILO[d.estado] : null;
                  return (
                    <td key={d.numeroDia} className="px-0.5 py-1 text-center">
                      <span
                        title={e ? e.texto : d.idComidaMenu ? "Sin marcar" : "No hay comida"}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${e ? e.clase : "bg-gray-100 text-gray-300"}`}
                      >
                        {e ? <e.Icono size={12} strokeWidth={3} /> : "·"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(r.comidasQueMasSalta.length > 0 || r.notas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
          {r.comidasQueMasSalta.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-nutri-ink mb-1.5">Comidas que más se salta o deja a medias</p>
              <ul className="space-y-1">
                {r.comidasQueMasSalta.slice(0, 3).map((s) => (
                  <li key={s.momento} className="text-xs text-gray-600 flex justify-between">
                    <span>{s.momento}</span>
                    <span className="tabular">{s.veces} {s.veces === 1 ? "vez" : "veces"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.notas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-nutri-ink mb-1.5 flex items-center gap-1.5">
                <MessageSquareText size={13} /> Comentarios del paciente
              </p>
              <ul className="space-y-1.5">
                {r.notas.slice(-4).map((n, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    <span className="text-gray-400">D{n.numeroDia} · {n.tipoComida}:</span> “{n.nota}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default CumplimientoMenu;

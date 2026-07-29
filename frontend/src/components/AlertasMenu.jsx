import { useState, useEffect } from "react";
import { listarAlertas, resolverAlerta } from "../services/alertaService";

const ESTILOS_NIVEL = {
  critica: { dot: "bg-nutri-pink", texto: "text-nutri-pink", badge: "bg-nutri-pink/15 text-nutri-pink" },
  advertencia: { dot: "bg-nutri-orange", texto: "text-nutri-orange", badge: "bg-nutri-orange/15 text-nutri-orange" },
  informativa: { dot: "bg-gray-400", texto: "text-gray-500", badge: "bg-gray-200 text-gray-500" },
};

// Lista las alertas nutricionales de un menú, en formato compacto (una
// línea por alerta), y deja que el nutriólogo las resuelva
// (aceptar/corregir/ignorar + observación opcional). La decisión queda
// registrada y no vuelve a molestar para ese menú (RF punto 5).
function AlertasMenu({ idPaciente, idMenu, onCambio }) {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [resolviendo, setResolviendo] = useState(null);
  const [observaciones, setObservaciones] = useState({});

  useEffect(() => {
    cargar();
  }, [idMenu]);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarAlertas(idPaciente, idMenu);
      setAlertas(data);
    } catch {
      // Silencioso a propósito: si fallan las alertas, no debe tumbar la
      // vista del menú — el nutriólogo igual puede ver/editar el menú.
    } finally {
      setCargando(false);
    }
  }

  async function handleResolver(idAlerta, estado) {
    try {
      await resolverAlerta(idPaciente, idMenu, idAlerta, {
        estado,
        observacion: observaciones[idAlerta] || undefined,
      });
      setResolviendo(null);
      await cargar();
      onCambio?.();
    } catch (err) {
      alert(err.message);
    }
  }

  if (cargando || alertas.length === 0) return null;

  const pendientes = alertas.filter((a) => a.estado === "pendiente");
  const resueltas = alertas.filter((a) => a.estado !== "pendiente");
  const conteo = (nivel) => pendientes.filter((a) => a.nivel === nivel).length;
  const criticas = conteo("critica");
  const advertencias = conteo("advertencia");
  const informativas = conteo("informativa");

  return (
    <div className="mb-4 text-sm">
      {pendientes.length > 0 && (
        <details className="border rounded-lg overflow-hidden" open={criticas > 0}>
          <summary className="cursor-pointer select-none px-3 py-1.5 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-semibold text-nutri-navy">
              Alertas nutricionales ({pendientes.length})
            </span>
            <span className="flex gap-1.5">
              {criticas > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ESTILOS_NIVEL.critica.badge}`}>
                  {criticas} crítica{criticas > 1 ? "s" : ""}
                </span>
              )}
              {advertencias > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ESTILOS_NIVEL.advertencia.badge}`}>
                  {advertencias} advertencia{advertencias > 1 ? "s" : ""}
                </span>
              )}
              {informativas > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ESTILOS_NIVEL.informativa.badge}`}>
                  {informativas} info
                </span>
              )}
            </span>
          </summary>
          <div className="divide-y">
            {pendientes.map((a) => {
              const estilo = ESTILOS_NIVEL[a.nivel] || ESTILOS_NIVEL.informativa;
              return (
                <div key={a.id} className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estilo.dot}`} />
                    <p className="text-xs text-gray-700 flex-1 min-w-0">{a.mensaje}</p>
                    {resolviendo !== a.id && (
                      <button
                        onClick={() => setResolviendo(a.id)}
                        className={`text-[11px] underline shrink-0 ${estilo.texto}`}
                      >
                        Revisar
                      </button>
                    )}
                  </div>
                  {resolviendo === a.id && (
                    <div className="mt-1.5 pl-3.5">
                      <textarea
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs mb-1.5"
                        placeholder="Observación (opcional)"
                        rows={1}
                        value={observaciones[a.id] || ""}
                        onChange={(e) =>
                          setObservaciones((prev) => ({ ...prev, [a.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleResolver(a.id, "aceptada")}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-nutri-teal text-white"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleResolver(a.id, "corregida")}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-nutri-navy text-white"
                        >
                          Corregida
                        </button>
                        <button
                          onClick={() => handleResolver(a.id, "ignorada")}
                          className="text-[11px] px-1.5 py-0.5 rounded border border-gray-300"
                        >
                          Ignorar
                        </button>
                        <button
                          onClick={() => setResolviendo(null)}
                          className="text-[11px] px-1.5 py-0.5 text-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}

      {resueltas.length > 0 && (
        <details className="text-[11px] text-gray-400 mt-1">
          <summary className="cursor-pointer">{resueltas.length} alerta(s) ya resuelta(s)</summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {resueltas.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.mensaje}</span> — {a.estado}
                {a.observacion && <> ({a.observacion})</>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default AlertasMenu;

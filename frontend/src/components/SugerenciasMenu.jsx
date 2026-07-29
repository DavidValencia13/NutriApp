import { useState, useEffect } from "react";
import { listarSugerencias } from "../services/sugerenciaService";

// Lista sugerencias de apoyo para completar el menú (grupos/nutrientes
// deficitarios + alimentos concretos del catálogo del paciente que podrían
// cubrirlos). Solo informativo: nunca modifica la dieta, el nutriólogo
// decide si las aplica (RF punto 4 y 10 — "no debe modificar automáticamente
// la dieta", "toda sugerencia debe ser editable").
function SugerenciasMenu({ idPaciente, idMenu }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarSugerencias(idPaciente, idMenu);
      setSugerencias(data);
    } catch {
      // Silencioso a propósito, igual que AlertasMenu: si fallan las
      // sugerencias, no debe tumbar la vista del menú.
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [idMenu]);

  if (cargando || sugerencias.length === 0) return null;

  return (
    <div className="mb-4 text-sm">
      <details className="border rounded-lg overflow-hidden">
        <summary className="cursor-pointer select-none px-3 py-1.5 flex items-center justify-between bg-gray-50">
          <span className="text-xs font-semibold text-nutri-navy">
            Sugerencias para completar el menú ({sugerencias.length})
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-nutri-blue/15 text-nutri-blue">
            apoyo, no automático
          </span>
        </summary>
        <div className="divide-y">
          {sugerencias.map((s) => (
            <div key={s.tipo} className="px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-nutri-blue" />
                <p className="text-xs text-gray-700 flex-1 min-w-0">{s.mensaje}</p>
              </div>
              {s.alimentosSugeridos?.length > 0 && (
                <div className="mt-1 pl-3.5 flex flex-wrap gap-1">
                  {s.alimentosSugeridos.map((a) => (
                    <span
                      key={a.id}
                      className="text-[11px] px-1.5 py-0.5 rounded-full bg-nutri-blue/10 text-nutri-blue"
                    >
                      {a.nombre}
                      {a.aporte && <span className="opacity-70"> · {a.aporte}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default SugerenciasMenu;

import { useState, useEffect } from "react";
import { obtenerEfectividad } from "../services/efectividadService";

const ESTILOS_INDICADOR = {
  efectiva: { label: "Dieta efectiva", clase: "bg-nutri-green/15 text-nutri-green", dot: "bg-nutri-green" },
  parcialmente_efectiva: {
    label: "Dieta parcialmente efectiva",
    clase: "bg-nutri-orange/15 text-nutri-orange",
    dot: "bg-nutri-orange",
  },
  necesita_ajustes: { label: "Dieta que necesita ajustes", clase: "bg-nutri-pink/15 text-nutri-pink", dot: "bg-nutri-pink" },
  informacion_insuficiente: {
    label: "Dieta con información insuficiente",
    clase: "bg-gray-200 text-gray-600",
    dot: "bg-gray-400",
  },
};

// Indicador de si la dieta está ayudando al paciente a cumplir su objetivo,
// combinando cumplimiento (Fase 6), evolución de peso (Consulta) y alertas
// nutricionales pendientes (Alerta). Es apoyo profesional, no un
// diagnóstico automático — la decisión final es siempre del nutriólogo
// (RF puntos 2 y 10).
function EfectividadMenu({ idPaciente, idMenu }) {
  const [efectividad, setEfectividad] = useState(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const data = await obtenerEfectividad(idPaciente, idMenu);
      setEfectividad(data);
    } catch {
      // Silencioso a propósito, igual que el resto de widgets de apoyo del
      // menú: no debe tumbar la vista si falla.
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [idMenu]);

  if (cargando || !efectividad) return null;

  const estilo = ESTILOS_INDICADOR[efectividad.indicador] || ESTILOS_INDICADOR.informacion_insuficiente;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 p-3 bg-white">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-xs font-semibold text-nutri-navy">Efectividad de la dieta</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${estilo.clase}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
          {estilo.label}
        </span>
      </div>
      {efectividad.motivos?.length > 0 && (
        <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
          {efectividad.motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-gray-400 mt-2">
        Indicador de apoyo — la decisión final sobre la dieta es siempre del nutriólogo.
      </p>
    </div>
  );
}

export default EfectividadMenu;

import { useState } from "react";
import Modal from "./Modal";
import { obtenerReporte } from "../services/reporteService";

// Mismos 4 estados/colores que EfectividadMenu.jsx — duplicado a propósito
// (4 líneas) en vez de importado, para no acoplar dos componentes solo por
// una constante y no romper react-refresh (que exige que un archivo de
// componente solo exporte componentes).
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

const NUTRIENTES_SEMANALES = [
  { campo: "calorias", label: "Calorías", unidad: "kcal" },
  { campo: "proteinas", label: "Proteínas", unidad: "g" },
  { campo: "carbohidratos", label: "Carbohidratos", unidad: "g" },
  { campo: "grasasTotales", label: "Grasas totales", unidad: "g" },
  { campo: "fibra", label: "Fibra", unidad: "g" },
  { campo: "sodio", label: "Sodio", unidad: "mg" },
];

// Botón + modal que arma y muestra el reporte nutricional completo del menú
// (RF punto 9): agrega en un solo documento lo que ya calculan Alerta,
// Consulta, Cumplimiento, Efectividad, Sugerencia y Recomendacion. No hace
// ningún cálculo nuevo, solo lo reúne para que el nutriólogo lo revise de
// un vistazo antes de la siguiente consulta.
function ReporteNutricional({ idPaciente, idMenu }) {
  const [abierto, setAbierto] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleAbrir() {
    setAbierto(true);
    setError("");
    setCargando(true);
    try {
      const data = await obtenerReporte(idPaciente, idMenu);
      setReporte(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        onClick={handleAbrir}
        className="border border-nutri-navy text-nutri-navy px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-nutri-navy hover:text-white transition-colors"
      >
        Ver reporte nutricional
      </button>

      <Modal isOpen={abierto} onClose={() => setAbierto(false)} title="Reporte nutricional" ancho="max-w-2xl">
        {cargando && <p className="text-sm text-gray-500">Generando reporte...</p>}
        {error && <p className="bg-red-100 text-red-700 text-xs p-2 rounded">{error}</p>}
        {reporte && !cargando && <ContenidoReporte reporte={reporte} />}
      </Modal>
    </>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-nutri-navy uppercase tracking-wide mb-1.5">{titulo}</p>
      {children}
    </div>
  );
}

function ContenidoReporte({ reporte }) {
  const { paciente, dieta, valoresNutricionales, distribucionMacronutrientes } = reporte;
  const estiloEfectividad =
    ESTILOS_INDICADOR[reporte.efectividad?.indicador] || ESTILOS_INDICADOR.informacion_insuficiente;
  const n = valoresNutricionales?.semanal?.nutrientes || {};

  return (
    <div className="text-sm">
      <p className="text-[11px] text-gray-400 mb-3">
        Generado el {new Date(reporte.generadoEn).toLocaleString()}
      </p>

      <Seccion titulo="Paciente y objetivo">
        <p>
          <span className="font-medium">{paciente.nombre}</span>
          {paciente.edad !== undefined && ` · ${paciente.edad} años`}
          {paciente.sexo && ` · ${paciente.sexo}`}
        </p>
        <p className="text-gray-600">Objetivo: {paciente.objetivo}</p>
        {(paciente.alergias?.length > 0 || paciente.enfermedades?.length > 0) && (
          <p className="text-gray-600">
            {paciente.alergias?.length > 0 && `Alergias: ${paciente.alergias.join(", ")}. `}
            {paciente.enfermedades?.length > 0 && `Enfermedades: ${paciente.enfermedades.join(", ")}.`}
          </p>
        )}
      </Seccion>

      <Seccion titulo="Dieta asignada">
        <p className="text-gray-600">
          Estado: {dieta.estado} · {dieta.dias?.length || 0} día(s) · {new Date(dieta.fechaInicio).toLocaleDateString()} a{" "}
          {new Date(dieta.fechaFin).toLocaleDateString()}
        </p>
      </Seccion>

      <Seccion titulo="Valores nutricionales semanales">
        <div className="grid grid-cols-3 gap-2 text-center">
          {NUTRIENTES_SEMANALES.map((item) => (
            <div key={item.campo} className="bg-gray-50 rounded-lg py-1.5 px-1">
              <p className="text-[11px] text-gray-500">{item.label}</p>
              <p className="text-sm font-semibold text-nutri-navy">
                {n[item.campo] !== undefined ? `${Math.round(n[item.campo])} ${item.unidad}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </Seccion>

      {distribucionMacronutrientes && (
        <Seccion titulo="Distribución de macronutrientes">
          <p className="text-gray-600">
            Proteínas {distribucionMacronutrientes.proteinasPorcentaje}% · Carbohidratos{" "}
            {distribucionMacronutrientes.carbohidratosPorcentaje}% · Grasas{" "}
            {distribucionMacronutrientes.grasasPorcentaje}%
          </p>
        </Seccion>
      )}

      {reporte.nutrientesDeficientesOExcesivos?.length > 0 && (
        <Seccion titulo="Nutrientes deficientes o excesivos">
          <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
            {reporte.nutrientesDeficientesOExcesivos.map((a) => (
              <li key={a.id}>{a.mensaje}</li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Alertas generadas">
        {reporte.alertas?.length > 0 ? (
          <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
            {reporte.alertas.map((a) => (
              <li key={a.id}>
                {a.mensaje} <span className="text-gray-400">({a.nivel}, {a.estado})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Sin alertas.</p>
        )}
      </Seccion>

      <Seccion titulo="Evolución del paciente">
        <p className="text-gray-600">
          {reporte.evolucion.totalConsultas > 0 ? (
            <>
              Peso inicial {reporte.evolucion.pesoInicial ?? "—"} kg → peso actual {reporte.evolucion.pesoActual ?? "—"} kg
              {reporte.evolucion.deltaPesoKg !== undefined &&
                ` (${reporte.evolucion.deltaPesoKg > 0 ? "+" : ""}${reporte.evolucion.deltaPesoKg} kg)`}
              {" · "}
              {reporte.evolucion.totalConsultas} consulta(s) registrada(s)
            </>
          ) : (
            "Sin consultas registradas todavía."
          )}
        </p>
      </Seccion>

      <Seccion titulo="Cumplimiento de la dieta">
        <p className="text-gray-600">
          {reporte.cumplimiento?.totalRegistros > 0 ? (
            <>
              {reporte.cumplimiento.porcentajeCumplimiento !== null
                ? `${reporte.cumplimiento.porcentajeCumplimiento}% de cumplimiento`
                : "Cumplimiento sin datos suficientes para calcular %"}{" "}
              · {reporte.cumplimiento.totalRegistros} registro(s)
            </>
          ) : (
            "Sin registros de cumplimiento todavía."
          )}
        </p>
      </Seccion>

      <Seccion titulo="Evaluación de efectividad">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${estiloEfectividad.clase}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estiloEfectividad.dot}`} />
          {estiloEfectividad.label}
        </span>
      </Seccion>

      <Seccion titulo="Recomendaciones para la siguiente consulta">
        {reporte.recomendacionesProximaConsulta?.length > 0 ? (
          <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
            {reporte.recomendacionesProximaConsulta.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Sin observaciones pendientes por ahora.</p>
        )}
      </Seccion>

      <p className="text-[11px] text-gray-400 mt-3">
        Reporte de apoyo — no reemplaza el criterio profesional del nutriólogo.
      </p>
    </div>
  );
}

export default ReporteNutricional;

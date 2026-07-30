import { useState } from "react";
import { labelGrupoAlimenticio } from "../constants/gruposAlimenticios";
import { CATALOGO_ALIMENTOS_BORRADOR } from "../constants/catalogoAlimentosBorrador";
import { IconChevronDown } from "./Icons";

// Mismos tokens de nivel usados en toda la app, para que "crítica/advertencia/info"
// se lean igual en cualquier pantalla.
const ESTILOS_NIVEL = {
  critica: { dot: "bg-nutri-pink", badge: "bg-nutri-pink/15 text-nutri-pink" },
  advertencia: { dot: "bg-nutri-orange", badge: "bg-nutri-orange/15 text-nutri-orange" },
  informativa: { dot: "bg-gray-400", badge: "bg-gray-200 text-gray-500" },
};

function ejemplosDelGrupo(grupo) {
  if (!grupo) return [];
  return CATALOGO_ALIMENTOS_BORRADOR
    .filter((alimento) => alimento.grupoPrincipal === grupo)
    .slice(0, 3)
    .map((alimento) => alimento.nombre);
}

// Guía de lo que le falta al catálogo del paciente para poder armarle una
// dieta balanceada. Solo lectura: no bloquea nada, la decisión es del
// nutriólogo (misma regla que Alertas y Sugerencias del menú).
//
// onAgregarGrupo permite que un chip de grupo faltante abra directamente el
// formulario de nuevo alimento con ese grupo ya marcado — es el atajo que
// convierte el aviso en acción.
function CoberturaCatalogo({ cobertura, cargando, onAgregarGrupo }) {
  // Cerrado por defecto siempre, incluso con alertas críticas: el resumen
  // compacto (siempre visible) ya comunica lo esencial sin ocupar la
  // pantalla. Abrir el detalle es una decisión del nutriólogo, no un default.
  const [abierto, setAbierto] = useState(false);

  if (cargando && !cobertura) {
    return (
      <p className="text-xs text-gray-400 mb-4">Revisando cobertura del catálogo...</p>
    );
  }
  if (!cobertura) return null;

  const { listoParaMenu, resumen, alertas } = cobertura;
  const conteo = (nivel) => alertas.filter((a) => a.nivel === nivel).length;
  const criticas = conteo("critica");
  const advertencias = conteo("advertencia");
  const informativas = conteo("informativa");
  const sinNutrientes = resumen.totalAlimentos - resumen.conInfoNutricional;

  const progreso = resumen.esencialesTotal
    ? resumen.esencialesCubiertos / resumen.esencialesTotal
    : 0;

  if (alertas.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-nutri-green/10 px-3 py-2 text-xs text-nutri-green">
        <span className="w-1.5 h-1.5 rounded-full bg-nutri-green shrink-0" />
        <span>
          <span className="font-semibold">Cobertura nutricional completa. </span>
          Los {resumen.totalAlimentos} alimentos cubren los {resumen.esencialesTotal} grupos
          esenciales y los nutrientes clave. Las cantidades disponibles se
          comprobarán al generar el menú semanal.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 border rounded-lg overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full cursor-pointer select-none px-3 py-2 flex items-center justify-between gap-2 bg-gray-50 text-left"
      >
        <span className="text-xs text-gray-600 min-w-0 flex-1">
          <span className="font-semibold text-nutri-navy">
            {resumen.esencialesCubiertos}/{resumen.esencialesTotal} grupos esenciales
          </span>
          {" · "}
          {alertas.length} alerta{alertas.length !== 1 ? "s" : ""}
          {sinNutrientes > 0 &&
            ` · ${sinNutrientes} sin nutrientes`}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
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
          <IconChevronDown
            className={`text-gray-400 transition-transform shrink-0 ${abierto ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {abierto && (
        <>
          <p className="px-3 pt-2 text-[11px] font-semibold text-nutri-navy">
            {listoParaMenu
              ? "Cómo mejorar el catálogo"
              : "Sugerencias para mejorar el menú antes de generarlo"}
          </p>

          {/* Avance de grupos esenciales: responde de un vistazo "¿cuánto me
              falta?" sin tener que leer la lista completa. */}
          <div className="px-3 pt-1.5 pb-1.5 border-b">
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
              <span>
                {resumen.esencialesCubiertos} de {resumen.esencialesTotal} grupos esenciales
              </span>
              <span className="tabular-nums">
                {resumen.conInfoNutricional}/{resumen.totalAlimentos} con datos nutricionales
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${listoParaMenu ? "bg-nutri-green" : "bg-nutri-orange"}`}
                style={{ width: `${Math.round(progreso * 100)}%` }}
              />
            </div>
          </div>

          <div className="divide-y">
            {alertas.map((a) => {
              const estilo = ESTILOS_NIVEL[a.nivel] || ESTILOS_NIVEL.informativa;
              const grupoSugerido = a.grupoSugerido || a.gruposSugeridos?.[0];
              const ejemplos = ejemplosDelGrupo(grupoSugerido);
              return (
                <div key={a.tipo} className="px-3 py-1.5">
                  <div className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${estilo.dot}`} />
                    <p className="text-xs text-gray-700 flex-1 min-w-0">{a.mensaje}</p>
                  </div>
                  {ejemplos.length > 0 && (
                    <p className="mt-1 pl-3.5 text-[10px] text-gray-500">
                      Opciones sugeridas: {ejemplos.join(", ")}.
                    </p>
                  )}
                  {grupoSugerido && onAgregarGrupo && (
                    <div className="mt-1.5 pl-3.5">
                      <button
                        type="button"
                        onClick={() => onAgregarGrupo(grupoSugerido)}
                        className="rounded-full border border-nutri-teal px-2 py-0.5 text-[10px] font-medium text-nutri-teal hover:bg-nutri-teal/10"
                      >
                        + Agregar {labelGrupoAlimenticio(grupoSugerido)}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CoberturaCatalogo;

import { AlertTriangle } from "lucide-react";
import { labelGrupoAlimenticio } from "../constants/gruposAlimenticios";

function CoberturaCatalogo({ cobertura, cargando, bloqueaMenu, onAgregarGrupo, onAgregarAlimento, onCompletarAlimento }) {
  if (cargando || !cobertura) return null;

  const alertas = cobertura.alertas || [];
  const alergia = alertas.find((alerta) => alerta.tipo.startsWith("alimento_alergia_"));
  const restriccion = alertas.find((alerta) => alerta.tipo.startsWith("alimento_restriccion_"));
  const incompatibilidad = alergia || restriccion;
  const sinDatos = alertas.find((alerta) => alerta.tipo === "alimentos_sin_info_nutricional");
  const sinNutrientes = cobertura.suficiencia?.alimentosSinDatos?.length > 0;
  const nombresSinPeso = cobertura.suficiencia?.alimentosSinPeso || [];
  const sinPeso = nombresSinPeso.length > 0;
  const nombresSinDatos = cobertura.suficiencia?.alimentosSinDatos || [];
  const datosIncompletos = sinDatos || sinNutrientes || sinPeso;
  const gruposAusentes = [...new Set(alertas.filter((alerta) => alerta.tipo.startsWith("grupo_ausente_")).map((alerta) => alerta.grupoSugerido).filter(Boolean))];
  const gruposSugeridos = [...new Set(alertas.flatMap((alerta) =>
    alerta.gruposSugeridos?.length ? alerta.gruposSugeridos : [alerta.grupoSugerido].filter(Boolean)
  ))];
  const grupos = (gruposAusentes.length ? gruposAusentes : gruposSugeridos).slice(0, 3);
  const faltanCantidades = (cobertura.suficiencia?.calorias?.porcentaje ?? 100) < 95 ||
    (cobertura.suficiencia?.proteinas?.porcentaje ?? 100) < 95;
  const gruposPresentesCompletos = cobertura.resumen?.esencialesTotal > 0 &&
    cobertura.resumen.esencialesCubiertos === cobertura.resumen.esencialesTotal;

  if (!incompatibilidad && !datosIncompletos && grupos.length === 0 && !faltanCantidades && cobertura.listoParaMenu) return null;

  return <section className={`food-selection-alert ${alergia ? "is-danger" : ""}`} aria-label={alergia ? "Alerta de alergia alimentaria" : "Alimentos que conviene revisar"} role={alergia ? "alert" : "status"}>
    <AlertTriangle size={18} aria-hidden="true" />
    <div>
      <strong>{alergia ? "Posible alimento incompatible con una alergia" : restriccion ? "Revisa una restricción alimentaria" : datosIncompletos ? "Completa datos nutricionales" : grupos.length ? bloqueaMenu ? "Completa variedad y nutrientes para el menú" : "Mejora la variedad del menú" : "Revisa cantidades"}</strong>
      <p>{incompatibilidad?.mensaje || (datosIncompletos ? sinPeso
        ? `Estos alimentos se compran por unidad y falta cuánto pesa 1 unidad: ${nombresSinPeso.join(", ")}. Pulsa cada uno y completa "Peso aproximado de 1 unidad".`
        : `Estos alimentos no tienen datos nutricionales: ${nombresSinDatos.join(", ") || "revisa la lista"}. Pulsa cada uno para consultar y confirmar su fuente.` : grupos.length
        ? `${gruposPresentesCompletos ? `Los ${cobertura.resumen.esencialesTotal} grupos están presentes, pero aún pueden faltar cantidades, variedad o nutrientes. ` : ""}${gruposAusentes.length ? "Agrega" : "Revisa"} ${grupos.map(labelGrupoAlimenticio).join(", ")}${gruposAusentes.length > grupos.length ? " y otros grupos" : ""} para planificar comidas variadas y suficientes.`
        : "La cantidad disponible podría no alcanzar para siete días.")}</p>
    </div>
    <div className="food-selection-actions">
      {!incompatibilidad && datosIncompletos && onCompletarAlimento && (sinPeso ? nombresSinPeso : nombresSinDatos).slice(0, 6).map((nombre) =>
        <button key={nombre} type="button" onClick={() => onCompletarAlimento(nombre)}>
          Completar {nombre}
        </button>
      )}
      {!incompatibilidad && !datosIncompletos && grupos.map((grupo) =>
        <button key={grupo} type="button" onClick={() => onAgregarGrupo?.(grupo)}>
          Elegir {labelGrupoAlimenticio(grupo)}
        </button>
      )}
      {!incompatibilidad && !datosIncompletos && grupos.length === 0 && <button type="button" onClick={onAgregarAlimento}>Agregar alimento</button>}
    </div>
  </section>;
}

export default CoberturaCatalogo;

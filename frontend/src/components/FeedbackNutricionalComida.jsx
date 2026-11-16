import { Activity } from "lucide-react";

function FeedbackNutricionalComida({ preview, cargando, error }) {
  if (!preview && !cargando && !error) return null;

  const nutrientes = preview?.nutrientes?.nutrientes || {};
  const resumen = [
    { nombre: "Energía", valor: nutrientes.calorias, unidad: "kcal" },
    { nombre: "Proteína", valor: nutrientes.proteinas, unidad: "g" },
    { nombre: "Carbohidratos", valor: nutrientes.carbohidratos, unidad: "g" },
    { nombre: "Grasas", valor: nutrientes.grasas, unidad: "g" },
    { nombre: "Fibra", valor: nutrientes.fibra, unidad: "g" },
  ].filter((item) => Number.isFinite(Number(item.valor)) && item.valor !== null && item.valor !== undefined);

  return (
    <div className="meal-preview">
      <h3><Activity size={16} aria-hidden="true" /> Composición estimada</h3>

      {cargando && <p className="text-gray-600 text-sm">Calculando nutrientes…</p>}

      {!cargando && !error && <div className="meal-preview-values">{resumen.length > 0 ? resumen.map((item) => <div key={item.nombre}><span>{item.nombre}</span><strong>{Number(item.valor).toFixed(1)} {item.unidad}</strong></div>) : <p>Esta selección no tiene nutrientes suficientes para estimar el aporte.</p>}</div>}

      {error && <p className="text-red-600 text-sm">No se pudo actualizar la estimación: {error}</p>}
    </div>
  );
}

export default FeedbackNutricionalComida;

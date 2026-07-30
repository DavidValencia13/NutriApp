function FeedbackNutricionalComida({ preview, cargando, error }) {
  if (!preview && !cargando) return null;

  const nutrientes = preview?.nutrientes?.nutrientes || {};

  return (
    <div className="bg-blue-50 border-l-4 border-nutri-blue p-4 mt-6 rounded">
      <h3 className="font-semibold text-nutri-navy mb-3">📊 Resumen nutricional en vivo</h3>

      {cargando && <p className="text-gray-600 text-sm">Calculando nutrientes...</p>}

      {!cargando && !error && (
        <>
          {/* Macros actuales */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Proteína</p>
              <p className="font-bold text-nutri-navy">
                {(nutrientes.proteinas || 0).toFixed(1)}g
              </p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Carbohidratos</p>
              <p className="font-bold text-nutri-navy">
                {(nutrientes.carbohidratos || 0).toFixed(1)}g
              </p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Grasas</p>
              <p className="font-bold text-nutri-navy">
                {(nutrientes.grasas || 0).toFixed(1)}g
              </p>
            </div>
            <div className="bg-white p-2 rounded text-center">
              <p className="text-xs text-gray-600">Fibra</p>
              <p className="font-bold text-nutri-navy">
                {(nutrientes.fibra || 0).toFixed(1)}g
              </p>
            </div>
          </div>

        </>
      )}

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
    </div>
  );
}

export default FeedbackNutricionalComida;

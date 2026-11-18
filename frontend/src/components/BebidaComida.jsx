import { useState } from "react";
import { CupSoda, Loader2 } from "lucide-react";

// Bebida que acompaña una comida: el nutricionista elige una sugerencia o
// escribe la suya. Es un complemento: no se suma al cálculo nutricional.
const SUGERENCIAS = [
  "Vaso de agua (250 ml)",
  "Agua aromática sin azúcar (manzanilla, hierba luisa o cedrón)",
  "Agua de canela sin azúcar",
  "Té verde sin azúcar",
  "Jugo natural de fruta sin azúcar (200 ml)",
  "Colada de avena sin azúcar (1 taza)",
  "Leche semidescremada (1 vaso)",
];

export function EditorBebida({ comida, onGuardar, onCancelar }) {
  const [texto, setTexto] = useState(comida.bebida || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(valor) {
    setError("");
    setGuardando(true);
    try {
      await onGuardar(valor.trim() || null);
    } catch (err) {
      setError(err.message || "No se pudo guardar");
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Elige una bebida para acompañar <strong>{comida.tipoComida.toLowerCase()}</strong> · {comida.nombrePlato}, o escribe la tuya.</p>
      <div className="flex flex-wrap gap-2">
        {SUGERENCIAS.map((s) => (
          <button key={s} type="button" onClick={() => setTexto(s)} aria-pressed={texto === s}
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${texto === s ? "border-nutri-brand bg-nutri-brand text-white" : "border-line text-gray-600 hover:border-nutri-brand"}`}>
            {s}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-medium text-nutri-ink">Bebida</span>
        <input type="text" value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: Agua aromática de hierba luisa, sin azúcar"
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
      </label>
      <p className="text-xs text-gray-500">Las bebidas son un complemento y no se suman a las calorías del menú. Si quieres que un jugo o una colada cuenten en el cálculo, agrega la fruta o la avena en "Ajustar comida".</p>
      {error && <p className="text-sm text-nutri-pink">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        {comida.bebida && (
          <button type="button" disabled={guardando} onClick={() => guardar("")} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-pink">Quitar bebida</button>
        )}
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg border border-line text-sm">Cancelar</button>
        <button type="button" disabled={guardando || !texto.trim()} onClick={() => guardar(texto)}
          className="px-4 py-2 rounded-lg bg-nutri-brand text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
          {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Guardar bebida
        </button>
      </div>
    </div>
  );
}

// Línea que ve el paciente (y el nutricionista) dentro de la comida
export function LineaBebida({ bebida, className = "" }) {
  if (!bebida) return null;
  return (
    <p className={`flex items-start gap-1.5 text-sm ${className}`}>
      <CupSoda size={16} className="shrink-0 mt-0.5 text-sky-600" aria-hidden="true" />
      <span><strong className="font-semibold">Bebida:</strong> {bebida}</span>
    </p>
  );
}

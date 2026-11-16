import { useState, useEffect } from "react";
import { ajustarComida } from "../services/menuService";
import { listarAlimentos } from "../services/alimentoService";
import { calcularPreviewNutrientes } from "../services/previewNutrientesService";
import FeedbackNutricionalComida from "./FeedbackNutricionalComida";
import { CirclePlus, Trash2, UtensilsCrossed } from "lucide-react";

function FormularioAjustarComida({ idPaciente, idMenu, comida, onSuccess, onCancel }) {
  const [alimentosDisponibles, setAlimentosDisponibles] = useState([]);
  const [calorias, setCalorias] = useState(comida.calorias);
  const [nombrePlato, setNombrePlato] = useState(comida.nombrePlato);
  const [filas, setFilas] = useState(
    (comida.detalles || []).map((d) => ({
      idAlimento: d.idAlimento,
      cantidad: d.cantidadUtilizada,
    })),
  );
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [errorPreview, setErrorPreview] = useState("");

  useEffect(() => {
    let vigente = true;
    listarAlimentos(idPaciente).then((datos) => {
      if (vigente) setAlimentosDisponibles(datos);
    }).catch((err) => {
      if (vigente) setError(err.message);
    }).finally(() => {
      if (vigente) setCargando(false);
    });
    return () => { vigente = false; };
  }, [idPaciente]);

  // Recalcula el resumen nutricional mientras el nutriólogo edita, con 500ms
  // de espera para no pegarle al backend en cada tecla. Solo se envían las
  // filas ya completas: una fila recién agregada tiene cantidad vacía y el
  // backend la rechazaría (cantidad no plausible), tumbando todo el preview.
  useEffect(() => {
    let vigente = true;
    const completas = filas
      .filter((f) => f.idAlimento && parseFloat(f.cantidad) > 0)
      .map((f) => ({ idAlimento: f.idAlimento, cantidad: parseFloat(f.cantidad) }));

    if (completas.length === 0) {
      queueMicrotask(() => { if (vigente) { setPreview(null); setCargandoPreview(false); } });
      return () => { vigente = false; };
    }

    queueMicrotask(() => { if (vigente) { setCargandoPreview(true); setErrorPreview(""); } });

    const timer = setTimeout(async () => {
      try {
        const resultado = await calcularPreviewNutrientes(idPaciente, idMenu, completas);
        if (vigente) setPreview(resultado);
      } catch (err) {
        if (vigente) setErrorPreview(err.message);
      } finally {
        if (vigente) setCargandoPreview(false);
      }
    }, 500);

    return () => { vigente = false; clearTimeout(timer); };
  }, [filas, idPaciente, idMenu]);

  function handleFilaChange(index, campo, valor) {
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [campo]: valor } : f)),
    );
  }

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      { idAlimento: alimentosDisponibles[0]?.id || "", cantidad: "" },
    ]);
  }

  function eliminarFila(index) {
    setFilas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (filas.length === 0) {
      setError("La comida debe tener al menos un alimento");
      return;
    }

    setGuardando(true);
    try {
      await ajustarComida(idPaciente, comida.id, {
        calorias: parseFloat(calorias),
        nombrePlato,
        alimentos: filas.map((f) => ({
          idAlimento: f.idAlimento,
          cantidad: parseFloat(f.cantidad),
        })),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-nutri-brand";
  const caloriasEstimadas = Number(preview?.nutrientes?.nutrientes?.calorias);

  if (cargando) return <p>Cargando alimentos...</p>;

  return (
    <form onSubmit={handleSubmit} className="meal-adjust-form">
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </p>
      )}

      <div className="form-intro"><span className="food-coverage-kicker">REVISIÓN DEL MENÚ</span><h3 className="flex items-center gap-2"><UtensilsCrossed size={20} aria-hidden="true" />{comida.tipoComida}</h3><p>Ajusta los alimentos y confirma el aporte antes de guardar.</p></div>

      <label className="text-sm font-medium text-gray-700">
        Nombre del plato
      </label>
      <input
        type="text"
        value={nombrePlato}
        onChange={(e) => setNombrePlato(e.target.value)}
        required
        className={`${inputClass} mb-4`}
      />

      <label className="text-sm font-medium text-gray-700">Calorías</label>
      <div className="meal-calories-row"><input type="number" step="0.01" value={calorias} onChange={(e) => setCalorias(e.target.value)} required className={inputClass} />{!cargandoPreview && Number.isFinite(caloriasEstimadas) && caloriasEstimadas > 0 && <button type="button" onClick={() => setCalorias(Math.round(caloriasEstimadas * 10) / 10)}>Usar estimación: {caloriasEstimadas.toFixed(0)} kcal</button>}</div>

      <p className="text-sm font-medium text-gray-700 mb-2">Alimentos</p>
      {filas.map((fila, index) => (
        <div key={index} className="meal-food-row">
          <select
            value={fila.idAlimento}
            onChange={(e) =>
              handleFilaChange(index, "idAlimento", e.target.value)
            }
            required
            className={inputClass}
          >
            {alimentosDisponibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) =>
              handleFilaChange(index, "cantidad", e.target.value)
            }
            required
            className={`${inputClass} meal-food-quantity`}
            aria-label={`Cantidad de ${alimentosDisponibles.find((a) => String(a.id) === String(fila.idAlimento))?.nombre || "alimento"}`}
          />
          <span className="meal-food-unit">{alimentosDisponibles.find((a) => String(a.id) === String(fila.idAlimento))?.unidadMedida || "unidad"}</span>
          <button
            type="button"
            onClick={() => eliminarFila(index)}
            className="meal-food-remove"
            aria-label="Quitar alimento"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={agregarFila}
        className="meal-food-add"
      >
        <CirclePlus size={16} aria-hidden="true" /> Agregar alimento
      </button>

      <FeedbackNutricionalComida
        preview={preview}
        cargando={cargandoPreview}
        error={errorPreview}
      />

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="px-4 py-2 rounded bg-nutri-brand text-white hover:bg-nutri-ink disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default FormularioAjustarComida;

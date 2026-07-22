import { useState, useEffect } from "react";
import { ajustarComida } from "../services/menuService";
import { listarAlimentos } from "../services/alimentoService";

function FormularioAjustarComida({ idPaciente, comida, onSuccess, onCancel }) {
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

  useEffect(() => {
    cargarAlimentos();
  }, []);

  async function cargarAlimentos() {
    try {
      const data = await listarAlimentos(idPaciente);
      setAlimentosDisponibles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

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
    "w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-nutri-teal";

  if (cargando) return <p>Cargando alimentos...</p>;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </p>
      )}

      <p className="text-sm text-gray-600 mb-3">
        Ajustando:{" "}
        <strong>
          {comida.tipoComida} — {comida.nombrePlato}
        </strong>
      </p>

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
      <input
        type="number"
        step="0.01"
        value={calorias}
        onChange={(e) => setCalorias(e.target.value)}
        required
        className={`${inputClass} mb-4`}
      />

      <p className="text-sm font-medium text-gray-700 mb-2">Alimentos</p>
      {filas.map((fila, index) => (
        <div key={index} className="flex gap-2 mb-2 items-center">
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
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) =>
              handleFilaChange(index, "cantidad", e.target.value)
            }
            required
            className={`${inputClass} w-28`}
          />
          <button
            type="button"
            onClick={() => eliminarFila(index)}
            className="text-nutri-pink text-sm px-2"
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={agregarFila}
        className="text-nutri-teal text-sm underline mb-4"
      >
        + Agregar alimento
      </button>

      <div className="flex justify-end gap-2 mt-2">
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
          className="px-4 py-2 rounded bg-nutri-teal text-white hover:bg-nutri-navy disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default FormularioAjustarComida;

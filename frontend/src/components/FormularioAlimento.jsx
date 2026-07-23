import { useState, useEffect } from "react";
import {
  registrarAlimento,
  editarAlimento,
} from "../services/alimentoService";

// Unidades principales que un nutriólogo usa al registrar alimentos:
// peso (g, kg, lb), volumen (ml, l) y conteo (unidad).
const UNIDADES_MEDIDA = [
  { value: "g", label: "Gramos (g)" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "lb", label: "Libras (lb)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "l", label: "Litros (l)" },
  { value: "unidad", label: "Unidad" },
];

function FormularioAlimento({ idPaciente, alimentoEditar, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    unidadMedida: "",
    precio: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Si viene un alimento a editar, precarga sus datos en el formulario
  useEffect(() => {
    if (alimentoEditar) {
      setForm({
        nombre: alimentoEditar.nombre,
        cantidad: alimentoEditar.cantidad,
        unidadMedida: alimentoEditar.unidadMedida,
        precio: alimentoEditar.precio,
      });
    }
  }, [alimentoEditar]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre,
        cantidad: parseFloat(form.cantidad),
        unidadMedida: form.unidadMedida,
        precio: parseFloat(form.precio),
      };

      // Si hay un alimentoEditar, actualiza; si no, crea uno nuevo
      if (alimentoEditar) {
        await editarAlimento(idPaciente, alimentoEditar.id, datos);
      } else {
        await registrarAlimento(idPaciente, datos);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const labelClass = "block mb-1 text-sm font-medium text-gray-700";
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-teal";
  const inputCompactClass =
    "w-24 text-center border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-teal";

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded-lg mb-4">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label className={labelClass}>Nombre</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          className={inputClass}
          placeholder="Ej: Arroz"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <div>
          <label className={labelClass}>Cantidad</label>
          <input
            type="number"
            step="0.01"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            required
            className={inputCompactClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unidad de medida</label>
          <select
            name="unidadMedida"
            value={form.unidadMedida}
            onChange={handleChange}
            required
            className="w-40 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-teal"
          >
            <option value="" disabled>
              Selecciona...
            </option>
            {UNIDADES_MEDIDA.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
            {/* Si el alimento ya tenía una unidad fuera de esta lista (ej. "KG"
                de un registro anterior), se conserva como opción para no
                perder el valor guardado al editar. */}
            {form.unidadMedida &&
              !UNIDADES_MEDIDA.some((u) => u.value === form.unidadMedida) && (
                <option value={form.unidadMedida}>{form.unidadMedida}</option>
              )}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>
          Precio por {form.unidadMedida || "unidad"}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0"
            name="precio"
            value={form.precio}
            onChange={handleChange}
            required
            className={inputCompactClass}
            placeholder="2.50"
          />
          <span className="text-gray-400 text-sm">$</span>
        </div>
      </div>

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
          className="px-4 py-2 rounded bg-nutri-teal text-white hover:bg-nutri-navy disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default FormularioAlimento;

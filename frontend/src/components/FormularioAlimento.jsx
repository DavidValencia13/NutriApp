import { useState, useEffect } from "react";
import {
  registrarAlimento,
  editarAlimento,
} from "../services/alimentoService";

function FormularioAlimento({ idPaciente, alimentoEditar, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    unidadMedida: "",
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

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-nutri-teal";

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </p>
      )}

      <label className="text-sm font-medium text-gray-700">Nombre</label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        required
        className={inputClass}
        placeholder="Ej: Arroz"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            step="0.01"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Unidad de medida
          </label>
          <input
            name="unidadMedida"
            value={form.unidadMedida}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Ej: g, kg, unidad"
          />
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

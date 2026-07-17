import { useState, useEffect } from "react";
import { registrarPaciente, editarPaciente } from "../services/pacienteService";

function FormularioPaciente({ pacienteEditar, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    nombre: "",
    peso: "",
    altura: "",
    objetivo: "",
    nivelActividad: "",
    numeroComidas: "",
    presupuesto: "",
    tiempoParaCocinar: "",
    restricciones: "",
    preferencias: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Si viene un paciente a editar, precarga sus datos en el formulario
  useEffect(() => {
    if (pacienteEditar) {
      setForm({
        nombre: pacienteEditar.nombre,
        peso: pacienteEditar.peso,
        altura: pacienteEditar.altura,
        objetivo: pacienteEditar.objetivo,
        nivelActividad: pacienteEditar.nivelActividad,
        numeroComidas: pacienteEditar.numeroComidas,
        presupuesto: pacienteEditar.presupuesto,
        tiempoParaCocinar: pacienteEditar.tiempoParaCocinar,
        restricciones: pacienteEditar.restricciones || "",
        preferencias: pacienteEditar.preferencias || "",
      });
    }
  }, [pacienteEditar]);

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
        ...form,
        peso: parseFloat(form.peso),
        altura: parseFloat(form.altura),
        numeroComidas: parseInt(form.numeroComidas),
        presupuesto: parseFloat(form.presupuesto),
        tiempoParaCocinar: parseInt(form.tiempoParaCocinar),
      };

      // Si hay un pacienteEditar, actualiza; si no, crea uno nuevo
      if (pacienteEditar) {
        await editarPaciente(pacienteEditar.id, datos);
      } else {
        await registrarPaciente(datos);
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
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            name="peso"
            value={form.peso}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Altura (m)
          </label>
          <input
            type="number"
            step="0.01"
            name="altura"
            value={form.altura}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
      </div>

      <label className="text-sm font-medium text-gray-700">Objetivo</label>
      <input
        name="objetivo"
        value={form.objetivo}
        onChange={handleChange}
        required
        className={inputClass}
        placeholder="Ej: Perder peso"
      />

      <label className="text-sm font-medium text-gray-700">
        Nivel de actividad
      </label>
      <input
        name="nivelActividad"
        value={form.nivelActividad}
        onChange={handleChange}
        required
        className={inputClass}
        placeholder="Ej: Moderado"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            # Comidas al día
          </label>
          <input
            type="number"
            name="numeroComidas"
            value={form.numeroComidas}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Presupuesto
          </label>
          <input
            type="number"
            step="0.01"
            name="presupuesto"
            value={form.presupuesto}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
      </div>

      <label className="text-sm font-medium text-gray-700">
        Tiempo para cocinar (min)
      </label>
      <input
        type="number"
        name="tiempoParaCocinar"
        value={form.tiempoParaCocinar}
        onChange={handleChange}
        required
        className={inputClass}
      />

      <label className="text-sm font-medium text-gray-700">Restricciones</label>
      <input
        name="restricciones"
        value={form.restricciones}
        onChange={handleChange}
        className={inputClass}
        placeholder="Ej: Ninguna"
      />

      <label className="text-sm font-medium text-gray-700">Preferencias</label>
      <input
        name="preferencias"
        value={form.preferencias}
        onChange={handleChange}
        className={inputClass}
        placeholder="Ej: Vegetariano"
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
          className="px-4 py-2 rounded bg-nutri-teal text-white hover:bg-nutri-navy disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default FormularioPaciente;

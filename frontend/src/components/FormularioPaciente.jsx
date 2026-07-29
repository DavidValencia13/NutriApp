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
    alergias: "",
    enfermedades: "",
    edad: "",
    sexo: "",
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
        alergias: (pacienteEditar.alergias || []).join(", "),
        enfermedades: (pacienteEditar.enfermedades || []).join(", "),
        edad: pacienteEditar.edad ?? "",
        sexo: pacienteEditar.sexo || "",
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
        alergias: form.alergias
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        enfermedades: form.enfermedades
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        edad: form.edad === "" ? null : parseInt(form.edad),
        sexo: form.sexo === "" ? null : form.sexo,
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
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelClass}>Peso (kg)</label>
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
          <label className={labelClass}>Altura (m)</label>
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelClass}>Edad</label>
          <input
            type="number"
            name="edad"
            value={form.edad}
            onChange={handleChange}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className={labelClass}>Sexo</label>
          <select
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-teal"
          >
            <option value="">Prefiero no decir</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>
      {/* Edad y sexo son opcionales: solo se usan para personalizar la
          alerta de rango calórico (fórmula Mifflin-St Jeor). Sin ellos, esa
          alerta específica no se genera, el resto de la app sigue igual. */}

      <div className="mb-4">
        <label className={labelClass}>Objetivo</label>
        <input
          name="objetivo"
          value={form.objetivo}
          onChange={handleChange}
          required
          className={inputClass}
          placeholder="Ej: Perder peso"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Nivel de actividad</label>
        <input
          name="nivelActividad"
          value={form.nivelActividad}
          onChange={handleChange}
          required
          className={inputClass}
          placeholder="Ej: Moderado"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelClass}># Comidas al día</label>
          <input
            type="number"
            name="numeroComidas"
            value={form.numeroComidas}
            onChange={handleChange}
            required
            className={inputCompactClass}
          />
        </div>
        <div>
          <label className={labelClass}>Presupuesto (semanal)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              name="presupuesto"
              value={form.presupuesto}
              onChange={handleChange}
              required
              className={inputCompactClass}
            />
            <span className="text-gray-400 text-sm">$</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Tiempo para cocinar (min)</label>
        <input
          type="number"
          name="tiempoParaCocinar"
          value={form.tiempoParaCocinar}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Alergias</label>
        <input
          name="alergias"
          value={form.alergias}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: maní, mariscos (separadas por coma)"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Enfermedades</label>
        <input
          name="enfermedades"
          value={form.enfermedades}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: diabetes tipo 2, hipertensión (separadas por coma)"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Restricciones</label>
        <input
          name="restricciones"
          value={form.restricciones}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: Ninguna"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Preferencias</label>
        <input
          name="preferencias"
          value={form.preferencias}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: Vegetariano"
        />
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

export default FormularioPaciente;

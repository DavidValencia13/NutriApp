import { useState } from "react";
import { registrarPaciente, editarPaciente } from "../services/pacienteService";
import { Activity, CalendarDays, Clock3, HeartPulse, Leaf, Ruler, Scale, ShieldAlert, Target, UserRound, UtensilsCrossed, Wallet } from "lucide-react";

const OBJETIVOS = ["Perder peso", "Mantener peso", "Ganar masa muscular"];

function FormularioPaciente({ pacienteEditar, onSuccess, onCancel }) {
  const [form, setForm] = useState(() => pacienteEditar ? {
    nombre: pacienteEditar.nombre,
    peso: pacienteEditar.peso,
    altura: pacienteEditar.altura,
    objetivo: pacienteEditar.objetivo,
    nivelActividad: pacienteEditar.nivelActividad,
    numeroComidas: pacienteEditar.numeroComidas,
    // 0 = sin presupuesto (se muestra vacío)
    presupuesto: Number(pacienteEditar.presupuesto) > 0 ? pacienteEditar.presupuesto : "",
    tiempoParaCocinar: pacienteEditar.tiempoParaCocinar,
    restricciones: pacienteEditar.restricciones || "",
    preferencias: pacienteEditar.preferencias || "",
    alergias: (pacienteEditar.alergias || []).join(", "),
    enfermedades: (pacienteEditar.enfermedades || []).join(", "),
    edad: pacienteEditar.edad ?? "",
    sexo: pacienteEditar.sexo || "",
  } : {
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function agregarEtiqueta(campo, valor) {
    setForm((prev) => {
      const existentes = prev[campo].split(",").map((item) => item.trim()).filter(Boolean);
      const seleccionado = existentes.some((item) => item.toLowerCase() === valor.toLowerCase());
      return { ...prev, [campo]: (seleccionado
        ? existentes.filter((item) => item.toLowerCase() !== valor.toLowerCase())
        : [...existentes, valor]).join(", ") };
    });
  }

  function tieneEtiqueta(campo, valor) {
    return form[campo].split(",").some((item) => item.trim().toLowerCase() === valor.toLowerCase());
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
        // Presupuesto opcional: vacío = 0 = sin límite (consulta privada)
        presupuesto: parseFloat(form.presupuesto) > 0 ? parseFloat(form.presupuesto) : 0,
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
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-brand";

  return (
    <form onSubmit={handleSubmit} className="patient-entry-form">
      <div className="form-intro"><span className="food-coverage-kicker">EXPEDIENTE CLÍNICO</span><h3>{pacienteEditar ? "Actualiza el perfil" : "Conoce a tu paciente"}</h3><p>Registra los datos necesarios para preparar el plan. Las condiciones y alergias se revisan antes de sugerir alimentos.</p></div>
      {error && (
        <p className="form-error bg-red-100 text-red-700 text-sm p-2 rounded-lg mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="mb-4 patient-form-full">
        <label htmlFor="patient-name" className={labelClass}><UserRound aria-hidden="true" />Nombre</label>
        <input
          id="patient-name"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="patient-weight" className={labelClass}><Scale aria-hidden="true" />Peso (kg)</label>
          <input
            id="patient-weight"
            type="number"
            step="0.1"
            min="0.1"
            name="peso"
            value={form.peso}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="patient-height" className={labelClass}><Ruler aria-hidden="true" />Altura (m)</label>
          <input
            id="patient-height"
            type="number"
            step="0.01"
            min="0.5"
            max="2.5"
            placeholder="Ej. 1.70"
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
          <label htmlFor="patient-age" className={labelClass}><CalendarDays aria-hidden="true" />Edad</label>
          <input
            id="patient-age"
            type="number"
            min="1"
            max="120"
            name="edad"
            value={form.edad}
            onChange={handleChange}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label htmlFor="patient-sex" className={labelClass}><UserRound aria-hidden="true" />Sexo</label>
          <select
            id="patient-sex"
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-brand"
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
        <label htmlFor="patient-goal" className={labelClass}><Target aria-hidden="true" />Objetivo</label>
        <select
          id="patient-goal"
          name="objetivo"
          value={form.objetivo}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="">Selecciona el objetivo</option>
          {OBJETIVOS.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
          {form.objetivo && !OBJETIVOS.includes(form.objetivo) && <option value={form.objetivo}>{form.objetivo}</option>}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="patient-activity" className={labelClass}><HeartPulse aria-hidden="true" />Nivel de actividad</label>
        <select
          id="patient-activity"
          name="nivelActividad"
          value={form.nivelActividad}
          onChange={handleChange}
          required
          className={inputClass}
        ><option value="">Selecciona el nivel</option><option value="Sedentario">Sedentario</option><option value="Bajo">Bajo</option><option value="Moderado">Moderado</option><option value="Alto">Alto</option><option value="Muy alto">Muy alto</option>{form.nivelActividad && !["Sedentario", "Bajo", "Moderado", "Alto", "Muy alto"].includes(form.nivelActividad) && <option value={form.nivelActividad}>{form.nivelActividad}</option>}</select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="patient-meals" className={labelClass}><UtensilsCrossed aria-hidden="true" />Comidas al día</label>
          <select id="patient-meals" name="numeroComidas" value={form.numeroComidas} onChange={handleChange} required className={inputClass}><option value="">Elige</option>{[3, 4, 5, 6].map((valor) => <option key={valor} value={valor}>{valor} comidas</option>)}{form.numeroComidas && ![3, 4, 5, 6].includes(Number(form.numeroComidas)) && <option value={form.numeroComidas}>{form.numeroComidas} comidas</option>}</select>
        </div>
        <div>
          <label htmlFor="patient-budget" className={labelClass}><Wallet aria-hidden="true" />Presupuesto semanal <span className="font-normal text-gray-400">(opcional)</span></label>
          <div className="flex items-center gap-1.5">
            <input
              id="patient-budget"
              type="number"
              step="0.01"
              min="0"
              name="presupuesto"
              value={form.presupuesto}
              onChange={handleChange}
              placeholder="Sin límite"
              className={inputClass}
            />
            <span className="text-gray-400 text-sm">$</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Déjalo vacío si no manejas presupuesto (por ejemplo, en consulta privada).</p>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="patient-cooking" className={labelClass}><Clock3 aria-hidden="true" />Tiempo para cocinar</label>
        <select id="patient-cooking" name="tiempoParaCocinar" value={form.tiempoParaCocinar} onChange={handleChange} required className={inputClass}><option value="">Elige el tiempo disponible</option>{[15, 30, 45, 60, 90].map((valor) => <option key={valor} value={valor}>{valor} min</option>)}{form.tiempoParaCocinar && ![15, 30, 45, 60, 90].includes(Number(form.tiempoParaCocinar)) && <option value={form.tiempoParaCocinar}>{form.tiempoParaCocinar} min</option>}</select>
      </div>

      <div className="mb-4">
        <label htmlFor="patient-allergies" className={labelClass}><ShieldAlert aria-hidden="true" />Alergias</label>
        <div className="form-suggestion-row">{["Maní", "Lácteos", "Mariscos", "Huevo"].map((valor) => <button key={valor} type="button" aria-pressed={tieneEtiqueta("alergias", valor)} onClick={() => agregarEtiqueta("alergias", valor)}>{valor}</button>)}</div>
        <input
          id="patient-allergies"
          name="alergias"
          value={form.alergias}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: maní, mariscos (separadas por coma)"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="patient-conditions" className={labelClass}><Activity aria-hidden="true" />Condiciones de salud</label>
        <div className="form-suggestion-row">{["Diabetes tipo 2", "Hipertensión", "Enfermedad renal"].map((valor) => <button key={valor} type="button" aria-pressed={tieneEtiqueta("enfermedades", valor)} onClick={() => agregarEtiqueta("enfermedades", valor)}>{valor}</button>)}</div>
        <input
          id="patient-conditions"
          name="enfermedades"
          value={form.enfermedades}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: diabetes tipo 2, hipertensión (separadas por coma)"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="patient-restrictions" className={labelClass}><ShieldAlert aria-hidden="true" />Restricciones</label>
        <input
          id="patient-restrictions"
          name="restricciones"
          value={form.restricciones}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: Ninguna"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="patient-preferences" className={labelClass}><Leaf aria-hidden="true" />Preferencias</label>
        <input
          id="patient-preferences"
          name="preferencias"
          value={form.preferencias}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej: Vegetariano"
        />
      </div>

      <div className="form-actions flex justify-end gap-2 mt-4">
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

export default FormularioPaciente;

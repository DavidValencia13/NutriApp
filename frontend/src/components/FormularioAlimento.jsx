import { useState, useEffect } from "react";
import {
  registrarAlimento,
  editarAlimento,
  buscarInfoNutricional,
} from "../services/alimentoService";
import { GRUPOS_ALIMENTICIOS } from "../constants/gruposAlimenticios";

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

// Debe coincidir con CAMPOS_NUTRIENTES del backend
// (backend/src/lib/Alimento/Dominio/Entidades/Alimento.js)
const GRUPOS_NUTRIENTES = [
  {
    titulo: "Macronutrientes",
    campos: [
      { key: "calorias", label: "Calorías", unidad: "kcal" },
      { key: "proteinas", label: "Proteínas", unidad: "g" },
      { key: "carbohidratos", label: "Carbohidratos", unidad: "g" },
      { key: "grasasTotales", label: "Grasas totales", unidad: "g" },
      { key: "grasasSaturadas", label: "Grasas saturadas", unidad: "g" },
      { key: "fibra", label: "Fibra", unidad: "g" },
      { key: "azucares", label: "Azúcares", unidad: "g" },
    ],
  },
  {
    titulo: "Minerales",
    campos: [
      { key: "sodio", label: "Sodio", unidad: "mg" },
      { key: "potasio", label: "Potasio", unidad: "mg" },
      { key: "calcio", label: "Calcio", unidad: "mg" },
      { key: "hierro", label: "Hierro", unidad: "mg" },
      { key: "magnesio", label: "Magnesio", unidad: "mg" },
    ],
  },
  {
    titulo: "Vitaminas",
    campos: [
      { key: "vitaminaA", label: "Vitamina A", unidad: "mcg" },
      { key: "vitaminaC", label: "Vitamina C", unidad: "mg" },
      { key: "vitaminaD", label: "Vitamina D", unidad: "mcg" },
      { key: "vitaminaB12", label: "Vitamina B12", unidad: "mcg" },
    ],
  },
];

const NUTRIENTES_VACIOS = GRUPOS_NUTRIENTES.flatMap((g) => g.campos).reduce(
  (acc, c) => ({ ...acc, [c.key]: "" }),
  {},
);

function FormularioAlimento({ idPaciente, alimentoEditar, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    unidadMedida: "",
    precioTotal: "",
  });
  const [gruposAlimenticios, setGruposAlimenticios] = useState([]);
  const [mostrarNutricional, setMostrarNutricional] = useState(false);
  const [refUnidad, setRefUnidad] = useState("g");
  const [gramosPorPorcion, setGramosPorPorcion] = useState("");
  const [nutrientes, setNutrientes] = useState(NUTRIENTES_VACIOS);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [buscandoNutricion, setBuscandoNutricion] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");

  // Si viene un alimento a editar, precarga sus datos en el formulario.
  // El backend guarda precio por unidad (ej. $/g); aquí se muestra el
  // total pagado (precio unitario × cantidad) porque es lo que el
  // nutriólogo recuerda naturalmente ("pagué $30 por estas 500g").
  useEffect(() => {
    if (alimentoEditar) {
      setForm({
        nombre: alimentoEditar.nombre,
        cantidad: alimentoEditar.cantidad,
        unidadMedida: alimentoEditar.unidadMedida,
        precioTotal: alimentoEditar.precio * alimentoEditar.cantidad,
      });
      setGruposAlimenticios(alimentoEditar.gruposAlimenticios || []);
      const info = alimentoEditar.infoNutricional;
      if (info) {
        setMostrarNutricional(true);
        setRefUnidad(info.refUnidad || "g");
        setGramosPorPorcion(info.gramosPorPorcion ?? "");
        setNutrientes({
          ...NUTRIENTES_VACIOS,
          ...Object.fromEntries(
            Object.entries(info).filter(
              ([k]) => k in NUTRIENTES_VACIOS && info[k] !== undefined,
            ),
          ),
        });
      }
    }
  }, [alimentoEditar]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleGrupo(value) {
    setGruposAlimenticios((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value],
    );
  }

  function handleNutrienteChange(key, value) {
    setNutrientes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleBuscarNutricion() {
    if (!form.nombre || form.nombre.trim().length === 0) return;
    setMensajeBusqueda("");
    setBuscandoNutricion(true);
    try {
      const resultado = await buscarInfoNutricional(idPaciente, form.nombre);
      if (!resultado) {
        setMensajeBusqueda(
          "No se encontraron datos automáticos para este alimento, complétalo manualmente.",
        );
        return;
      }
      setMostrarNutricional(true);
      setRefUnidad("g");
      setNutrientes((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(resultado).filter(([k]) => k in NUTRIENTES_VACIOS),
        ),
      }));
      setMensajeBusqueda(
        `Sugerido por USDA FoodData Central${
          resultado.nombreEncontrado ? ` ("${resultado.nombreEncontrado}")` : ""
        } — revisa y ajusta si es necesario.`,
      );
    } catch (err) {
      setMensajeBusqueda(
        "No se pudo completar la búsqueda automática, complétalo manualmente.",
      );
    } finally {
      setBuscandoNutricion(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (gruposAlimenticios.length === 0) {
      setError("Selecciona al menos un grupo alimenticio");
      return;
    }
    setGuardando(true);
    try {
      const cantidad = parseFloat(form.cantidad);
      const precioTotal = parseFloat(form.precioTotal);
      const datos = {
        nombre: form.nombre,
        cantidad,
        unidadMedida: form.unidadMedida,
        // El backend guarda precio POR unidad de medida; el nutriólogo
        // captura el total pagado, así que aquí se hace la división.
        precio: precioTotal / cantidad,
        gruposAlimenticios,
      };

      // Solo se manda infoNutricional si el nutriólogo abrió la sección y
      // cargó al menos un valor; evita mandar un objeto vacío.
      if (mostrarNutricional) {
        const nutrientesLlenos = Object.fromEntries(
          Object.entries(nutrientes)
            .filter(([, v]) => v !== "")
            .map(([k, v]) => [k, parseFloat(v)]),
        );
        if (Object.keys(nutrientesLlenos).length > 0) {
          datos.infoNutricional = {
            refUnidad,
            ...(refUnidad === "porcion"
              ? { gramosPorPorcion: parseFloat(gramosPorPorcion) }
              : {}),
            ...nutrientesLlenos,
          };
        }
      }

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
        <div className="flex gap-2">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Ej: Arroz"
          />
          <button
            type="button"
            onClick={handleBuscarNutricion}
            disabled={buscandoNutricion || !form.nombre?.trim()}
            className="shrink-0 whitespace-nowrap px-3 py-2 rounded-lg border border-nutri-teal text-nutri-teal text-sm hover:bg-nutri-teal/10 disabled:opacity-50"
          >
            {buscandoNutricion ? "Buscando..." : "Buscar en USDA"}
          </button>
        </div>
        {mensajeBusqueda && (
          <p className="text-xs text-gray-500 mt-1">{mensajeBusqueda}</p>
        )}
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
          Precio total pagado por esta cantidad
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0"
            name="precioTotal"
            value={form.precioTotal}
            onChange={handleChange}
            required
            className={inputCompactClass}
            placeholder="30.00"
          />
          <span className="text-gray-400 text-sm">$</span>
        </div>
        {/* Ayuda visual: confirma al nutriólogo cuánto sale por unidad,
            que es lo que realmente se guarda y usa la IA para calcular costos. */}
        {form.cantidad > 0 && form.precioTotal !== "" && (
          <p className="text-xs text-gray-400 mt-1">
            ≈ {(parseFloat(form.precioTotal) / parseFloat(form.cantidad)).toFixed(4)}{" "}
            $ por {form.unidadMedida || "unidad"}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className={labelClass}>Grupo(s) alimenticio(s)</label>
        <div className="flex flex-wrap gap-2">
          {GRUPOS_ALIMENTICIOS.map((g) => (
            <label
              key={g.value}
              className={`text-xs px-2 py-1 rounded-full border cursor-pointer select-none ${
                gruposAlimenticios.includes(g.value)
                  ? "bg-nutri-teal text-white border-nutri-teal"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={gruposAlimenticios.includes(g.value)}
                onChange={() => toggleGrupo(g.value)}
              />
              {g.label}
            </label>
          ))}
        </div>
        {gruposAlimenticios.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            Selecciona al menos un grupo alimenticio.
          </p>
        )}
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setMostrarNutricional((v) => !v)}
          className="text-sm text-nutri-teal hover:underline"
        >
          {mostrarNutricional ? "− Ocultar" : "+ Agregar"} información
          nutricional (opcional)
        </button>

        {mostrarNutricional && (
          <div className="mt-3 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-3">
              <label className={labelClass}>Valores por</label>
              <select
                value={refUnidad}
                onChange={(e) => setRefUnidad(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              >
                <option value="g">100 gramos</option>
                <option value="porcion">porción</option>
              </select>
              {refUnidad === "porcion" && (
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={gramosPorPorcion}
                  onChange={(e) => setGramosPorPorcion(e.target.value)}
                  placeholder="gramos por porción"
                  className="w-40 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  required={refUnidad === "porcion"}
                />
              )}
            </div>

            {GRUPOS_NUTRIENTES.map((grupo) => (
              <div key={grupo.titulo} className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  {grupo.titulo}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {grupo.campos.map((c) => (
                    <div key={c.key} className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={nutrientes[c.key]}
                        onChange={(e) =>
                          handleNutrienteChange(c.key, e.target.value)
                        }
                        placeholder={c.label}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-400 shrink-0">
                        {c.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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

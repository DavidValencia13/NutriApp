import { useState, useEffect } from "react";
import {
  registrarAlimento,
  editarAlimento,
  buscarInfoNutricional,
} from "../services/alimentoService";
import {
  GRUPOS_ALIMENTICIOS,
  labelGrupoAlimenticio,
} from "../constants/gruposAlimenticios";
import { CATALOGO_ALIMENTOS_BORRADOR } from "../constants/catalogoAlimentosBorrador";

// Quita tildes/mayúsculas para comparar texto libre (preferencias) sin
// depender de cómo lo haya escrito el nutriólogo.
function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Grupos a sugerir en el primer paso, priorizados por lo que realmente le
// falta al catálogo del paciente (mismo orden que ya calcula el backend:
// críticas primero) y no por una lista plana de los 12 grupos. El backend ya
// tiene en cuenta objetivo/alergias/restricciones al calcular esos huecos;
// aquí se suma un ajuste liviano por preferencia vegetariana/vegana, que el
// evaluador todavía no considera.
function gruposSugeridos(cobertura, paciente) {
  const todos = GRUPOS_ALIMENTICIOS.map((g) => g.value);
  if (!cobertura?.alertas?.length) return todos;

  const orden = [];
  for (const nivel of ["critica", "advertencia", "informativa"]) {
    for (const alerta of cobertura.alertas.filter((a) => a.nivel === nivel)) {
      for (const g of alerta.gruposSugeridos || []) {
        if (!orden.includes(g)) orden.push(g);
      }
    }
  }

  const pref = normalizar(paciente?.preferencias);
  if (
    (pref.includes("vegetarian") || pref.includes("vegan")) &&
    orden.includes("proteinas") &&
    !orden.includes("legumbres")
  ) {
    orden.splice(orden.indexOf("proteinas") + 1, 0, "legumbres");
  }

  return orden.length > 0 ? orden : todos;
}

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

// Solo las unidades de peso permiten calcular "total para lo que compré": no
// hay forma confiable de convertir ml/l/unidad a gramos sin conocer densidad
// o peso por unidad, así que para esas se sigue mostrando por 100 g/porción.
const GRAMOS_POR_UNIDAD = { g: 1, kg: 1000, lb: 453.592 };

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

function FormularioAlimento({
  idPaciente,
  alimentoEditar,
  gruposIniciales,
  paciente,
  cobertura,
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    unidadMedida: "",
    precioTotal: "",
  });
  // Al crear, puede venir preseleccionado desde un aviso de cobertura ("+
  // Lácteos"); al editar, lo sobreescribe el efecto con los grupos guardados.
  const [gruposAlimenticios, setGruposAlimenticios] = useState(
    gruposIniciales || [],
  );
  const [mostrarNutricional, setMostrarNutricional] = useState(false);
  const [refUnidad, setRefUnidad] = useState("g");
  const [gramosPorPorcion, setGramosPorPorcion] = useState("");
  const [nutrientes, setNutrientes] = useState(NUTRIENTES_VACIOS);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [buscandoNutricion, setBuscandoNutricion] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [estadoBusqueda, setEstadoBusqueda] = useState("aviso");
  // Preferencia de vista de los nutrientes: total para lo comprado (por
  // defecto) o por 100 g/porción. Los valores GUARDADOS (estado `nutrientes`)
  // siempre quedan en base 100 g/porción — esto es solo una conversión de
  // ida y vuelta al mostrarlos/editarlos, para no tocar lo que ya espera el
  // backend ni el cálculo nutricional del menú.
  const [verTotal, setVerTotal] = useState(true);

  // Selector previo por grupo: al crear, primero se sugiere el grupo y luego
  // un alimento de ese grupo, en vez de escribir el nombre a ciegas. Al
  // editar se conserva el formulario de siempre, sin repetir este selector.
  const [paso, setPaso] = useState(() => {
    if (alimentoEditar) return "form";
    return gruposIniciales?.[0] ? "sugerencias" : "grupo";
  });
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(
    gruposIniciales?.[0] || null,
  );
  // true solo si los grupos vienen tal cual del catálogo curado: en ese caso
  // se muestran fijos (no editables) más abajo, para no permitir
  // combinaciones sin sentido (ej. "tomate" marcado como proteína y bebida).
  const [origenCatalogo, setOrigenCatalogo] = useState(false);

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

  function handleNutrienteChange(key, value) {
    setNutrientes((prev) => ({ ...prev, [key]: value }));
  }

  // Cuánto pesa en total lo que se está registrando (solo calculable si la
  // unidad es de peso: g/kg/lb). Sin esto no hay forma confiable de mostrar
  // "el total para lo que compré".
  const puedeCalcularTotal =
    Boolean(GRAMOS_POR_UNIDAD[form.unidadMedida]) && Number(form.cantidad) > 0;
  const gramosTotalCantidad = puedeCalcularTotal
    ? Number(form.cantidad) * GRAMOS_POR_UNIDAD[form.unidadMedida]
    : 0;
  // Base sobre la que están guardados los valores en `nutrientes` ahora
  // mismo: 100 g, o los gramos de una porción si refUnidad es "porcion".
  const gramosBase = refUnidad === "porcion" ? Number(gramosPorPorcion) || 0 : 100;
  const mostrandoTotal = verTotal && puedeCalcularTotal;
  const factorVista = mostrandoTotal && gramosBase > 0 ? gramosTotalCantidad / gramosBase : 1;

  // Convierte el valor guardado (por 100 g/porción) a lo que corresponde
  // mostrar según la vista activa, solo para pintarlo en el input.
  function valorMostrado(key) {
    const guardado = nutrientes[key];
    if (guardado === "" || factorVista === 1) return guardado;
    const numero = parseFloat(guardado);
    if (!Number.isFinite(numero)) return guardado;
    return String(Math.round(numero * factorVista * 100) / 100);
  }

  // Lo que el nutriólogo escribe está en la vista activa (ej. total para 2
  // kg); antes de guardarlo en `nutrientes` se vuelve a expresar en la base
  // 100 g/porción, que es lo único que el backend entiende.
  function handleNutrienteChangeVista(key, valorEscrito) {
    if (valorEscrito === "" || factorVista === 1) {
      handleNutrienteChange(key, valorEscrito);
      return;
    }
    const numero = parseFloat(valorEscrito);
    if (!Number.isFinite(numero)) {
      handleNutrienteChange(key, valorEscrito);
      return;
    }
    handleNutrienteChange(key, String(numero / factorVista));
  }

  async function handleBuscarNutricion(nombreOverride) {
    const nombre = nombreOverride ?? form.nombre;
    if (!nombre || nombre.trim().length === 0) return;
    setMensajeBusqueda("");
    setEstadoBusqueda("aviso");
    setBuscandoNutricion(true);
    try {
      const resultado = await buscarInfoNutricional(idPaciente, nombre);
      if (!resultado) {
        setMensajeBusqueda(
          "No se encontraron datos automáticos para este alimento, complétalo manualmente.",
        );
        return;
      }
      setMostrarNutricional(true);
      setEstadoBusqueda("exito");
      setRefUnidad("g");
      setNutrientes((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(resultado).filter(([k]) => k in NUTRIENTES_VACIOS),
        ),
      }));
      setMensajeBusqueda(
        "Datos nutricionales encontrados correctamente en FoodData Central, una fuente de referencia confiable. Confirma que correspondan a la presentación del alimento.",
      );
    } catch {
      setEstadoBusqueda("aviso");
      setMensajeBusqueda(
        "No se pudo completar la búsqueda automática, complétalo manualmente.",
      );
    } finally {
      setBuscandoNutricion(false);
    }
  }

  function elegirGrupo(grupo) {
    setGrupoSeleccionado(grupo);
    setPaso("sugerencias");
  }

  // Selección desde el catálogo de sugerencias: prellena nombre y grupos
  // reales del alimento (no solo el grupo por el que se navegó, ya
  // clasificados de antemano — no editables, ver sección de grupos más
  // abajo), y busca en USDA con el término en inglés ya preparado para cada
  // alimento — así funciona aunque la traducción por IA no esté disponible.
  function elegirAlimentoSugerido(item) {
    setForm((prev) => ({ ...prev, nombre: item.nombre }));
    setGruposAlimenticios(item.gruposAlimenticios);
    setOrigenCatalogo(true);
    setPaso("form");
    handleBuscarNutricion(item.terminosBusquedaUsda?.[0] || item.nombre);
  }

  // Registro manual: un solo grupo principal, editable (ver más abajo);
  // parte del grupo ya elegido en el paso anterior si venía de ahí.
  function elegirOtroAlimento() {
    setGruposAlimenticios(grupoSeleccionado ? [grupoSeleccionado] : []);
    setOrigenCatalogo(false);
    setPaso("form");
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

  // Paso 1: sugerencias de grupo según lo que le falta al catálogo del
  // paciente (objetivo, alergias y restricciones ya entran en ese cálculo) y
  // su preferencia alimentaria, en vez de una lista plana de los 12 grupos.
  if (paso === "grupo") {
    const sugeridos = gruposSugeridos(cobertura, paciente).slice(0, 6);
    return (
      <div>
        <p className={labelClass}>Sugerencias</p>
        <p className="text-xs text-gray-500 mb-3">
          Según el objetivo y las preferencias de {paciente?.nombre || "el paciente"}, estos grupos suman más al plan.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {sugeridos.map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => elegirGrupo(valor)}
              className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-nutri-teal hover:text-nutri-teal text-left"
            >
              {labelGrupoAlimenticio(valor)}
            </button>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={elegirOtroAlimento}
            className="text-sm text-nutri-teal hover:underline"
          >
            Registrar un alimento distinto →
          </button>
        </div>
      </div>
    );
  }

  // Paso 2: alimentos sugeridos del grupo elegido + salida siempre
  // disponible a registrar uno distinto a mano.
  if (paso === "sugerencias") {
    const sugeridos = CATALOGO_ALIMENTOS_BORRADOR.filter(
      (a) => a.grupoPrincipal === grupoSeleccionado,
    );
    return (
      <div>
        <button
          type="button"
          onClick={() => setPaso("grupo")}
          className="text-xs text-gray-400 hover:text-gray-600 mb-2"
        >
          ← Ver otras sugerencias
        </button>
        <p className={labelClass}>
          Alimentos comunes de "{labelGrupoAlimenticio(grupoSeleccionado)}"
        </p>
        {sugeridos.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">
            Todavía no hay sugerencias para este grupo.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {sugeridos.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => elegirAlimentoSugerido(a)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-nutri-teal hover:text-nutri-teal text-left"
              >
                {a.nombre}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={elegirOtroAlimento}
            className="text-sm text-nutri-teal hover:underline"
          >
            Registrar un alimento distinto →
          </button>
        </div>
      </div>
    );
  }

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
          <div
            role="status"
            className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
              estadoBusqueda === "exito"
                ? "border-nutri-teal/20 bg-nutri-teal/10 text-nutri-teal"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {estadoBusqueda === "exito" && (
              <span className="mr-1 font-semibold">Fuente USDA:</span>
            )}
            {mensajeBusqueda}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className={labelClass}>Grupo alimenticio</label>
        {origenCatalogo ? (
          // Viene de una sugerencia del catálogo: la clasificación ya es
          // correcta (ej. lenteja = legumbres + proteínas) y se muestra fija,
          // no editable — evita combinaciones sin sentido al tocarla a mano.
          <div className="flex flex-wrap gap-2">
            {gruposAlimenticios.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-1 rounded-full bg-nutri-teal text-white"
              >
                {labelGrupoAlimenticio(g)}
              </span>
            ))}
          </div>
        ) : (
          // Registro manual o edición: un solo grupo principal, no una
          // combinación libre de los 12 — un alimento no es a la vez
          // "proteína" y "bebida" y "fruta".
          <select
            value={gruposAlimenticios[0] || ""}
            onChange={(e) =>
              setGruposAlimenticios(e.target.value ? [e.target.value] : [])
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nutri-teal"
          >
            <option value="" disabled>
              Selecciona...
            </option>
            {GRUPOS_ALIMENTICIOS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        )}
        {gruposAlimenticios.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            Selecciona un grupo alimenticio.
          </p>
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
            <label className={labelClass}>Mostrando</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {puedeCalcularTotal && (
                <button
                  type="button"
                  onClick={() => setVerTotal(true)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    mostrandoTotal
                      ? "bg-nutri-teal text-white border-nutri-teal"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  Total para {form.cantidad} {form.unidadMedida}
                </button>
              )}
              <button
                type="button"
                onClick={() => setVerTotal(false)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  !mostrandoTotal
                    ? "bg-nutri-teal text-white border-nutri-teal"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Por 100 g / porción
              </button>
            </div>

            {!mostrandoTotal && (
              <div className="flex items-center gap-3 mb-1">
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
            )}
            <p className="text-xs text-gray-400 mb-3">
              {mostrandoTotal
                ? `Valores totales para ${form.cantidad} ${form.unidadMedida} de este alimento.`
                : puedeCalcularTotal
                  ? "Referencia estándar de etiqueta nutricional, independiente de la cantidad comprada."
                  : "Para ver el total según lo comprado, usa una unidad de peso (g, kg o lb) arriba."}
            </p>

            {GRUPOS_NUTRIENTES.map((grupo) => (
              <div key={grupo.titulo} className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  {grupo.titulo}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {grupo.campos.map((c) => (
                    <div key={c.key}>
                      <label className="text-[11px] text-gray-500 leading-tight block truncate">
                        {c.label}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={valorMostrado(c.key)}
                          placeholder="Sin dato"
                          onChange={(e) =>
                            handleNutrienteChangeVista(c.key, e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-gray-400 shrink-0">
                          {c.unidad}
                        </span>
                      </div>
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

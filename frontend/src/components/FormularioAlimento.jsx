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
import IndicadorPresupuesto from "./IndicadorPresupuesto";

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

// Las unidades de volumen usan una equivalencia aproximada de 1 ml ≈ 1 g.
// La interfaz lo advierte porque la densidad exacta depende del producto.
const BASE_POR_UNIDAD = { g: 1, kg: 1000, lb: 453.592, ml: 1, l: 1000 };
const UNIDADES_VOLUMEN = new Set(["ml", "l"]);

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

const APORTES_DESTACABLES = [
  { key: "proteinas", label: "proteína", minimo: 5 },
  { key: "fibra", label: "fibra", minimo: 2.5 },
  { key: "calcio", label: "calcio", minimo: 100 },
  { key: "hierro", label: "hierro", minimo: 1.5 },
  { key: "vitaminaC", label: "vitamina C", minimo: 10 },
  { key: "potasio", label: "potasio", minimo: 300 },
];

function mensajeAporteNutricional(info) {
  const aportes = APORTES_DESTACABLES
    .filter(({ key, minimo }) => Number(info?.[key]) >= minimo)
    .sort((a, b) => Number(info[b.key]) / b.minimo - Number(info[a.key]) / a.minimo)
    .slice(0, 2)
    .map(({ label }) => label);

  if (aportes.length === 0) {
    return "Información nutricional disponible para revisar.";
  }
  if (aportes.length === 1) {
    return `Aporte destacado: ${aportes[0]}.`;
  }
  return `Aportes destacados: ${aportes[0]} y ${aportes[1]}.`;
}

function FormularioAlimento({
  idPaciente,
  alimentoEditar,
  gruposIniciales,
  paciente,
  cobertura,
  costoCatalogo = 0,
  presupuesto,
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
  const [tipoMedida, setTipoMedida] = useState(null);
  const [sugerenciasBusqueda, setSugerenciasBusqueda] = useState([]);
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
      setTipoMedida(
        UNIDADES_VOLUMEN.has(alimentoEditar.unidadMedida) ? "volumen" : "peso",
      );
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
    Boolean(BASE_POR_UNIDAD[form.unidadMedida]) && Number(form.cantidad) > 0;
  const gramosTotalCantidad = puedeCalcularTotal
    ? Number(form.cantidad) * BASE_POR_UNIDAD[form.unidadMedida]
    : 0;
  // Base sobre la que están guardados los valores en `nutrientes` ahora
  // mismo: 100 g, o los gramos de una porción si refUnidad es "porcion".
  const gramosBase = refUnidad === "porcion" ? Number(gramosPorPorcion) || 0 : 100;
  const mostrandoTotal = verTotal && puedeCalcularTotal;
  const factorVista = mostrandoTotal && gramosBase > 0 ? gramosTotalCantidad / gramosBase : 1;
  const tieneDatosNutricionales = Object.values(nutrientes).some(
    (valor) => valor !== "" && valor !== null && valor !== undefined,
  );
  const costoAnterior = alimentoEditar
    ? Number(alimentoEditar.cantidad || 0) * Number(alimentoEditar.precio || 0)
    : 0;
  const precioTotalIngresado = Number(form.precioTotal);
  const costoProyectado =
    Number(costoCatalogo) -
    costoAnterior +
    (Number.isFinite(precioTotalIngresado) ? precioTotalIngresado : 0);
  const presupuestoExcedido =
    Number(presupuesto) > 0 && costoProyectado > Number(presupuesto);
  const precioPor100g =
    form.unidadMedida === "g" && Number(form.cantidad) > 0
      ? (precioTotalIngresado / Number(form.cantidad)) * 100
      : 0;
  const precioPorUnidad =
    Number(form.cantidad) > 0 ? precioTotalIngresado / Number(form.cantidad) : 0;
  const unidadesDisponibles = UNIDADES_MEDIDA.filter((unidad) => {
    if (tipoMedida === "volumen") return UNIDADES_VOLUMEN.has(unidad.value);
    if (tipoMedida === "peso") return !UNIDADES_VOLUMEN.has(unidad.value);
    return true;
  });

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
    const nombre =
      typeof nombreOverride === "string" ? nombreOverride : form.nombre;
    if (!nombre || nombre.trim().length === 0) return;
    setMensajeBusqueda("");
    setSugerenciasBusqueda([]);
    setEstadoBusqueda("aviso");
    setBuscandoNutricion(true);
    try {
      const resultado = await buscarInfoNutricional(idPaciente, nombre);
      if (!resultado) {
        setMensajeBusqueda(
          "No encontramos una coincidencia exacta. Prueba una sugerencia o completa los datos manualmente.",
        );
        const grupo = gruposAlimenticios[0] || grupoSeleccionado;
        setSugerenciasBusqueda(
          CATALOGO_ALIMENTOS_BORRADOR.filter(
            (item) =>
              (!grupo || item.gruposAlimenticios.includes(grupo)) &&
              normalizar(item.nombre) !== normalizar(nombre),
          ).slice(0, 3),
        );
        return;
      }
      setMostrarNutricional(true);
      setEstadoBusqueda("exito");
      setRefUnidad("g");
      setTipoMedida(resultado.tipoMedicion);
      setForm((prev) => {
        if (resultado.tipoMedicion === "volumen") {
          return {
            ...prev,
            unidadMedida: UNIDADES_VOLUMEN.has(prev.unidadMedida)
              ? prev.unidadMedida
              : "l",
          };
        }
        if (UNIDADES_VOLUMEN.has(prev.unidadMedida)) {
          return { ...prev, unidadMedida: "g" };
        }
        return prev;
      });
      setNutrientes((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(resultado).filter(([k]) => k in NUTRIENTES_VACIOS),
        ),
      }));
      setMensajeBusqueda(
        mensajeAporteNutricional(resultado),
      );
    } catch {
      setEstadoBusqueda("aviso");
      setSugerenciasBusqueda([]);
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
    setTipoMedida(item.tipoMedida || null);
    setForm((prev) => ({
      ...prev,
      nombre: item.nombre,
      unidadMedida:
        item.tipoMedida === "volumen" &&
        !UNIDADES_VOLUMEN.has(prev.unidadMedida)
          ? "l"
          : prev.unidadMedida,
    }));
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
    if (presupuestoExcedido) {
      setError(
        `El costo del catálogo superaría el presupuesto semanal por $${(
          costoProyectado - Number(presupuesto)
        ).toFixed(2)}. Ajusta el precio o la cantidad antes de guardar.`,
      );
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
            {sugerenciasBusqueda.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {sugerenciasBusqueda.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => elegirAlimentoSugerido(item)}
                    className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                  >
                    {item.nombre}
                  </button>
                ))}
              </div>
            )}
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
            {unidadesDisponibles.map((u) => (
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
          {tipoMedida === "volumen" && (
            <p className="mt-1 text-xs text-nutri-teal">
              Alimento líquido: registra la cantidad en ml o l.
            </p>
          )}
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
            {form.unidadMedida === "g"
              ? `≈ $${precioPor100g.toFixed(2)} por 100 g`
              : `≈ $${precioPorUnidad.toFixed(4)} por ${form.unidadMedida || "unidad"}`}
          </p>
        )}
      </div>

      <div className="mb-4">
        <IndicadorPresupuesto
          costo={costoProyectado}
          presupuesto={presupuesto}
          titulo="Presupuesto después de guardar"
        />
        {precioPor100g > Number(presupuesto) && Number(presupuesto) > 0 && (
          <p className="mt-2 rounded-lg bg-nutri-pink/10 px-3 py-2 text-xs font-medium text-nutri-pink">
            Revisa la cantidad o la unidad: con estos datos, 100 g costarían $
            {precioPor100g.toFixed(2)}.
          </p>
        )}
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setMostrarNutricional((v) => !v)}
          className="text-sm text-nutri-teal hover:underline"
        >
          {mostrarNutricional
            ? "− Ocultar detalles nutricionales"
            : tieneDatosNutricionales
              ? "Ver detalles nutricionales"
              : "+ Completar datos nutricionales manualmente (opcional)"}
        </button>

        {mostrarNutricional && (
          <div className="mt-3 border border-gray-200 rounded-lg p-3">
            <h3 className="mb-3 text-sm font-semibold text-nutri-navy">
              Composición nutricional
            </h3>
            <label htmlFor="base-nutricional" className={labelClass}>
              Presentación de los valores
            </label>
            <select
              id="base-nutricional"
              value={mostrandoTotal ? "total" : "referencia"}
              onChange={(e) => setVerTotal(e.target.value === "total")}
              className="mb-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nutri-teal sm:w-auto"
            >
              {puedeCalcularTotal && (
                <option value="total">
                  Aporte nutricional total ({form.cantidad} {form.unidadMedida})
                </option>
              )}
              <option value="referencia">
                {refUnidad === "porcion"
                  ? "Valores nutricionales por porción"
                  : tipoMedida === "volumen"
                    ? "Composición nutricional por 100 ml (aprox.)"
                    : "Composición nutricional por 100 g"}
              </option>
            </select>
            <p className="text-xs text-gray-400 mb-3">
              {mostrandoTotal
                ? "Nutrientes calculados para toda la cantidad registrada."
                : puedeCalcularTotal
                  ? tipoMedida === "volumen"
                    ? "Referencia estimada con 1 ml ≈ 1 g; la densidad del producto puede modificar el valor real."
                    : "Referencia estandarizada para analizar y comparar alimentos."
                  : tipoMedida === "volumen"
                    ? "Usa ml o l para calcular el aporte nutricional total."
                    : "Usa una unidad de peso (g, kg o lb) para calcular el aporte total."}
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

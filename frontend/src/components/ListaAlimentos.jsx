import { useState, useEffect, useCallback } from "react";
import {
  listarAlimentos,
  eliminarAlimento,
  obtenerCoberturaCatalogo,
} from "../services/alimentoService";
import FormularioAlimento from "./FormularioAlimento";
import CoberturaCatalogo from "./CoberturaCatalogo";
import { catalogoPreparadoParaMenu } from "../utils/suficiencia";
import { IconAlertTriangle, IconLeaf, IconSearch } from "./Icons";
import { Apple, Beef, Layers3, Milk, Pencil, ShieldAlert, Sprout, Target, Trash2, Wallet2 } from "lucide-react";
import {
  GRUPOS_ALIMENTICIOS,
  labelGrupoAlimenticio,
} from "../constants/gruposAlimenticios";

function sinRestricciones(texto) {
  return /^(ninguna?|no aplica|n\/a|-)$/i.test(texto.trim());
}

function precioDeReferencia(alimento) {
  const precio = Number(alimento.precio);
  if (alimento.unidadMedida === "g") {
    return `${(precio * 100).toFixed(2)}$/100 g`;
  }
  return `${precio.toFixed(4)}$/${alimento.unidadMedida}`;
}

function IconoAlimento({ grupos = [] }) {
  if (grupos.includes("frutas")) return <Apple size={20} strokeWidth={1.8} aria-hidden="true" />;
  if (grupos.includes("lacteos")) return <Milk size={20} strokeWidth={1.8} aria-hidden="true" />;
  if (grupos.includes("legumbres")) return <Sprout size={20} strokeWidth={1.8} aria-hidden="true" />;
  if (grupos.includes("proteinas")) return <Beef size={20} strokeWidth={1.8} aria-hidden="true" />;
  return <Sprout size={20} strokeWidth={1.8} aria-hidden="true" />;
}

function fotoAlimento(nombre = "") {
  const texto = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (texto.includes("aguacate")) return "food-photo-avocado";
  if (texto.includes("tilapia")) return "food-photo-fish";
  if (texto.includes("frejol negro") || texto.includes("frijol negro")) return "food-photo-beans";
  return "";
}

// Gestiona los alimentos de un paciente dentro del modal "Alimentos".
// Alterna entre vista de lista y vista de formulario con un estado local:
// evita abrir un segundo <Modal> apilado sobre el que ya está abierto.
function ListaAlimentos({ idPaciente, paciente, onContinue }) {
  const [alimentos, setAlimentos] = useState([]);
  const [cobertura, setCobertura] = useState(null);
  const [cargandoCobertura, setCargandoCobertura] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("lista"); // "lista" | "formulario"
  const [alimentoEditar, setAlimentoEditar] = useState(null); // null = modo crear
  const [gruposIniciales, setGruposIniciales] = useState([]); // preselección al crear
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [verTodos, setVerTodos] = useState(false);

  // La cobertura se recalcula en el backend a partir del catálogo completo,
  // así que hay que volver a pedirla después de cada alta/edición/baja. Falla
  // en silencio: es una guía, no debe impedir gestionar los alimentos.
  const cargarCobertura = useCallback(async () => {
    setCargandoCobertura(true);
    try {
      setCobertura(await obtenerCoberturaCatalogo(idPaciente));
    } catch {
      setCobertura(null);
    } finally {
      setCargandoCobertura(false);
    }
  }, [idPaciente]);

  const cargarAlimentos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await listarAlimentos(idPaciente);
      setAlimentos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
    cargarCobertura();
  }, [idPaciente, cargarCobertura]);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => { if (activo) cargarAlimentos(); });
    return () => { activo = false; };
  }, [cargarAlimentos]);

  async function handleEliminar(id) {
    if (!confirm("¿Seguro que deseas eliminar este alimento?")) return;
    try {
      await eliminarAlimento(idPaciente, id);
      cargarAlimentos();
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirFormularioCrear() {
    setAlimentoEditar(null);
    setGruposIniciales([]);
    setVista("formulario");
  }

  // Atajo desde un aviso de cobertura: abre el formulario de alta con el
  // grupo faltante ya marcado, para no obligar al nutriólogo a recordar cuál
  // era el hueco que estaba llenando.
  function abrirFormularioConGrupo(grupo) {
    setAlimentoEditar(null);
    setGruposIniciales([grupo]);
    setVista("formulario");
  }

  function abrirFormularioEditar(alimento) {
    setAlimentoEditar(alimento);
    setGruposIniciales([]);
    setVista("formulario");
  }

  function handleSuccessFormulario() {
    setVista("lista");
    setAlimentoEditar(null);
    setGruposIniciales([]);
    cargarAlimentos();
  }

  function handleCancelFormulario() {
    setVista("lista");
    setAlimentoEditar(null);
    setGruposIniciales([]);
  }

  // Perfil compacto del paciente: una sola línea (envuelve si hace falta) en
  // vez de tarjetas apiladas. Se usa tanto en la lista como en el formulario
  // para no perder de vista restricciones/preferencias/objetivo, pero sin
  // ocupar el espacio vertical que ocupaban las tarjetas de color completas.
  const perfilPaciente = paciente && (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
      <span>
        <span className="font-semibold text-nutri-ink">Objetivo:</span>{" "}
        {paciente.objetivo}
      </span>
      {paciente.restricciones && !sinRestricciones(paciente.restricciones) && (
        <span className="inline-flex items-center gap-1 text-nutri-orange">
          <IconAlertTriangle className="shrink-0" />
          {paciente.restricciones}
        </span>
      )}
      {paciente.preferencias && (
        <span className="inline-flex items-center gap-1 text-nutri-brand">
          <IconLeaf className="shrink-0" />
          {paciente.preferencias}
        </span>
      )}
    </div>
  );

  // Título contextual del formulario: reemplaza el panel completo de
  // cobertura por una frase que dice exactamente qué hueco se está llenando
  // (o qué se está editando), sin que el nutriólogo tenga que releer todo.
  function contextoFormulario() {
    if (alimentoEditar) return `Editando "${alimentoEditar.nombre}"`;
    if (gruposIniciales.length > 0)
      return `Agregando una fuente de ${gruposIniciales.map(labelGrupoAlimenticio).join(", ")}`;
    return "Nuevo alimento";
  }

  const costoCatalogo = alimentos.reduce(
    (total, alimento) =>
      total + Number(alimento.cantidad || 0) * Number(alimento.precio || 0),
    0,
  );

  if (vista === "formulario") {
    return (
      // Ancho cómodo de lectura para un formulario, aunque la modal ahora
      // sea ancha (max-w-5xl a nivel de Modal): ensanchar cada campo hasta
      // ocupar todo el ancho disponible empeoraría la lectura, no la mejora.
      <div className="max-w-xl mx-auto">
        <p className="font-semibold text-nutri-ink mb-1">{contextoFormulario()}</p>
        {perfilPaciente}
        <FormularioAlimento
          idPaciente={idPaciente}
          alimentoEditar={alimentoEditar}
          gruposIniciales={gruposIniciales}
          paciente={paciente}
          cobertura={cobertura}
          costoCatalogo={costoCatalogo}
          presupuesto={paciente?.presupuesto}
          onSuccess={handleSuccessFormulario}
          onCancel={handleCancelFormulario}
        />
      </div>
    );
  }

  if (cargando) return <p>Cargando alimentos...</p>;

  const alimentosFiltrados = alimentos.filter((a) => {
    const coincideNombre = a.nombre
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());
    const coincideGrupo =
      !filtroGrupo || (a.gruposAlimenticios || []).includes(filtroGrupo);
    return coincideNombre && coincideGrupo;
  });
  const expandirLista = verTodos || busqueda.trim() || filtroGrupo;
  const alimentosVisibles = expandirLista ? alimentosFiltrados : alimentosFiltrados.slice(0, 5);
  const puedeContinuar = !cargando && !cargandoCobertura && catalogoPreparadoParaMenu(cobertura, alimentos.length);

  return (
    <div>
      <div className="food-overview" aria-label="Resumen de alimentos para el menú">
        <div><Target size={21} aria-hidden="true" /><span>Objetivo<strong>{paciente?.objetivo || "Sin registrar"}</strong></span></div>
        <div><Layers3 size={21} aria-hidden="true" /><span>Guardados<strong>{alimentos.length} alimentos</strong></span></div>
        <div><Sprout size={21} aria-hidden="true" /><span>Grupos presentes<strong>{cobertura?.resumen?.esencialesCubiertos ?? "—"} / {cobertura?.resumen?.esencialesTotal ?? "—"}</strong></span></div>
        <div><Wallet2 size={21} aria-hidden="true" /><span>Presupuesto semanal<strong>{Number(paciente?.presupuesto) > 0 ? <>${costoCatalogo.toFixed(2)} / ${Number(paciente.presupuesto).toFixed(2)}</> : <>${costoCatalogo.toFixed(2)} <small className="font-normal">· sin límite</small></>}</strong></span></div>
        {onContinue && <button type="button" className="food-overview-next" onClick={onContinue} disabled={!puedeContinuar} title={puedeContinuar ? "Revisar la propuesta de menú" : "Completa los alimentos y sus datos nutricionales para continuar"}>Continuar al menú <span aria-hidden="true">→</span></button>}
      </div>
      {!cargandoCobertura && !cobertura && <p className="food-coverage-unavailable" role="status">No se pudo comprobar el catálogo. Vuelve a abrir esta vista para intentarlo de nuevo.</p>}
      {paciente?.alergias?.length > 0 && <p className="food-allergy-note"><ShieldAlert size={15} aria-hidden="true" /> Alergias registradas: {paciente.alergias.join(", ")}. Revísalas antes de generar el menú.</p>}
      <div className="food-list-layout">
      <div>
        <CoberturaCatalogo
          cobertura={cobertura}
          cargando={cargandoCobertura}
          bloqueaMenu={!puedeContinuar}
          onAgregarGrupo={abrirFormularioConGrupo}
          onAgregarAlimento={abrirFormularioCrear}
          onCompletarAlimento={(nombre) => {
            const alimento = alimentos.find((a) => a.nombre === nombre);
            if (alimento) abrirFormularioEditar(alimento);
          }}
        />
      </div>

      <div className="min-w-0">
        <div className="food-list-heading">
          <div><span className="food-coverage-kicker">DISPONIBILIDAD SEMANAL</span><h2>Alimentos</h2></div>
          <button
            onClick={abrirFormularioCrear}
            className="food-add-button"
          >
            + Agregar alimento
          </button>
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">
            {error}
          </p>
        )}

        {alimentos.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setVerTodos(false); }}
                placeholder="Buscar por nombre..."
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nutri-brand"
              />
            </div>
            <select
              value={filtroGrupo}
              onChange={(e) => { setFiltroGrupo(e.target.value); setVerTodos(false); }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm sm:w-48 focus:outline-none focus:ring-2 focus:ring-nutri-brand"
            >
              <option value="">Todos los grupos</option>
              {GRUPOS_ALIMENTICIOS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {alimentos.length === 0 ? (
          <p className="text-gray-500">
            Este paciente todavía no tiene alimentos registrados.
          </p>
        ) : alimentosFiltrados.length === 0 ? (
          <p className="text-gray-500">
            Ningún alimento coincide con la búsqueda o el filtro.
          </p>
        ) : (
          <div>
            <div className={`grid gap-2 ${verTodos ? "food-list-scroll" : ""}`}>
            {alimentosVisibles.map((a) => (
              <div key={a.id} className="food-list-item">
                {fotoAlimento(a.nombre)
                  ? <span className={`food-list-photo ${fotoAlimento(a.nombre)}`} aria-hidden="true" />
                  : <span className="food-list-item-icon"><IconoAlimento grupos={a.gruposAlimenticios} /></span>}
                <div className="food-list-item-main">
                  <p className="font-medium">{a.nombre}</p>
                  {cobertura?.suficiencia?.alimentosSinPeso?.includes(a.nombre) && (
                    <button type="button" onClick={() => abrirFormularioEditar(a)}
                      className="mt-1 inline-flex items-center gap-1 rounded-full bg-nutri-pink/10 px-2 py-0.5 text-[11px] font-semibold text-nutri-pink hover:bg-nutri-pink/20">
                      ⚠ Falta peso de 1 unidad · completar
                    </button>
                  )}
                  <p className="food-list-item-meta" title={`Precio de referencia: ${precioDeReferencia(a)}`}>
                    {a.cantidad} {a.unidadMedida === "unidad" ? Number(a.cantidad) === 1 ? "unidad" : "unidades" : a.unidadMedida} disponibles <span>·</span> ${(Number(a.precio) * Number(a.cantidad)).toFixed(2)} total
                  </p>
                  {a.unidadMedida === "g" && Number(paciente?.presupuesto) > 0 &&
                    Number(a.precio) * 100 > Number(paciente?.presupuesto) && (
                      <p className="mt-1 text-xs font-medium text-nutri-pink">
                        Revisa precio y unidad: 100 g cuestan $
                        {(Number(a.precio) * 100).toFixed(2)}, más que el
                        presupuesto semanal.
                      </p>
                    )}
                  {a.gruposAlimenticios?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.gruposAlimenticios.map((g) => (
                        <span
                          key={g}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-nutri-brand/10 text-nutri-brand"
                        >
                          {labelGrupoAlimenticio(g)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="food-list-item-nutrients" title={a.infoNutricional?.nombreReferencia || ""}>
                  {a.infoNutricional?.calorias != null ? <>
                    <span>FICHA {a.infoNutricional.fuente || "NUTRICIONAL"}</span>
                    <strong>{Math.round(a.infoNutricional.calorias)} kcal <small>/ {a.infoNutricional.refUnidad === "porcion" ? "porción" : `${a.infoNutricional.refCantidad || 100} ${a.infoNutricional.refUnidad || "g"}`}</small></strong>
                    <p>{a.infoNutricional.proteinas != null ? `${Number(a.infoNutricional.proteinas).toFixed(1)} g de proteína` : "Proteína sin dato"}{a.infoNutricional.fibra != null ? ` · ${Number(a.infoNutricional.fibra).toFixed(1)} g de fibra` : ""}</p>
                  </> : <><span>FICHA NUTRICIONAL</span><p>Datos pendientes: edita para consultar una fuente.</p></>}
                </div>
                <div className="food-list-item-actions">
                  <button
                    onClick={() => abrirFormularioEditar(a)}
                    aria-label={`Editar ${a.nombre}`}
                    title={`Editar ${a.nombre}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleEliminar(a.id)}
                    aria-label={`Eliminar ${a.nombre}`}
                    title={`Eliminar ${a.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            </div>
            {!busqueda.trim() && !filtroGrupo && alimentosFiltrados.length > 5 && (
              <button type="button" className="food-list-more" onClick={() => setVerTodos((actual) => !actual)} aria-expanded={verTodos}>
                {verTodos ? "Ver solo los primeros 5" : `Ver ${alimentosFiltrados.length - 5} alimentos más`}
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default ListaAlimentos;

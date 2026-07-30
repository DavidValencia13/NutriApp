import { useState, useEffect } from "react";
import {
  listarAlimentos,
  eliminarAlimento,
  obtenerCoberturaCatalogo,
} from "../services/alimentoService";
import FormularioAlimento from "./FormularioAlimento";
import CoberturaCatalogo from "./CoberturaCatalogo";
import IndicadorPresupuesto from "./IndicadorPresupuesto";
import { IconAlertTriangle, IconLeaf, IconSearch } from "./Icons";
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

// Gestiona los alimentos de un paciente dentro del modal "Alimentos".
// Alterna entre vista de lista y vista de formulario con un estado local:
// evita abrir un segundo <Modal> apilado sobre el que ya está abierto.
function ListaAlimentos({ idPaciente, paciente }) {
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

  useEffect(() => {
    cargarAlimentos();
  }, [idPaciente]);

  async function cargarAlimentos() {
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
  }

  // La cobertura se recalcula en el backend a partir del catálogo completo,
  // así que hay que volver a pedirla después de cada alta/edición/baja. Falla
  // en silencio: es una guía, no debe impedir gestionar los alimentos.
  async function cargarCobertura() {
    setCargandoCobertura(true);
    try {
      setCobertura(await obtenerCoberturaCatalogo(idPaciente));
    } catch {
      setCobertura(null);
    } finally {
      setCargandoCobertura(false);
    }
  }

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
        <span className="font-semibold text-nutri-navy">Objetivo:</span>{" "}
        {paciente.objetivo}
      </span>
      {paciente.restricciones && !sinRestricciones(paciente.restricciones) && (
        <span className="inline-flex items-center gap-1 text-nutri-orange">
          <IconAlertTriangle className="shrink-0" />
          {paciente.restricciones}
        </span>
      )}
      {paciente.preferencias && (
        <span className="inline-flex items-center gap-1 text-nutri-teal">
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
        <p className="font-semibold text-nutri-navy mb-1">{contextoFormulario()}</p>
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Columna izquierda: contexto del paciente + guía de cobertura.
          Apilada arriba en móvil, al costado en escritorio — no empuja
          "+ Nuevo alimento" fuera de la pantalla porque ambas van
          colapsadas/compactas por defecto. */}
      <div className="lg:w-[35%] shrink-0">
        {perfilPaciente}
        <CoberturaCatalogo
          cobertura={cobertura}
          cargando={cargandoCobertura}
          onAgregarGrupo={abrirFormularioConGrupo}
        />
      </div>

      {/* Columna derecha: la acción principal y el catálogo. */}
      <div className="lg:w-[65%] min-w-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Alimentos</h2>
          <button
            onClick={abrirFormularioCrear}
            className="bg-nutri-teal text-white px-3 py-1 rounded text-sm hover:bg-nutri-navy"
          >
            + Nuevo alimento
          </button>
        </div>

        <div className="mb-3">
          <IndicadorPresupuesto
            costo={costoCatalogo}
            presupuesto={paciente?.presupuesto}
          />
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
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nutri-teal"
              />
            </div>
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm sm:w-48 focus:outline-none focus:ring-2 focus:ring-nutri-teal"
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
          <div className="grid gap-2">
            {alimentosFiltrados.map((a) => (
              <div
                key={a.id}
                className="bg-gray-50 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{a.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {a.cantidad} {a.unidadMedida} · $
                    {(Number(a.precio) * Number(a.cantidad)).toFixed(2)} total (
                    {precioDeReferencia(a)})
                  </p>
                  {a.unidadMedida === "g" &&
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
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-nutri-teal/10 text-nutri-teal"
                        >
                          {labelGrupoAlimenticio(g)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => abrirFormularioEditar(a)}
                    className="text-nutri-teal hover:opacity-70 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(a.id)}
                    className="text-nutri-pink hover:opacity-70 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListaAlimentos;

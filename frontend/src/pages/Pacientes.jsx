import { useState, useEffect } from "react";
import { listarPacientes, eliminarPaciente } from "../services/pacienteService";
import Modal from "../components/Modal";
import FormularioPaciente from "../components/FormularioPaciente";
import ListaAlimentos from "../components/ListaAlimentos";
import MenuPaciente from "../components/MenuPaciente";
import SeguimientoPaciente from "../components/SeguimientoPaciente";
import {
  IconUsers,
  IconPlus,
  IconFork,
  IconList,
  IconPencil,
  IconTrash,
  IconScale,
  IconRuler,
  IconActivity,
  IconAlertTriangle,
  IconLeaf,
  IconCalendarCheck,
  IconSearch,
} from "../components/Icons";

function sinRestricciones(texto) {
  return /^(ninguna?|no aplica|n\/a|-)$/i.test(texto.trim());
}

function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/);
  const a = partes[0]?.charAt(0) || "";
  const b = partes[1]?.charAt(0) || "";
  return (a + b).toUpperCase() || "?";
}

const coloresAvatar = [
  "bg-nutri-teal",
  "bg-nutri-blue",
  "bg-nutri-orange",
  "bg-nutri-green",
  "bg-nutri-pink",
  "bg-nutri-navy",
];

function colorAvatar(id) {
  return coloresAvatar[id % coloresAvatar.length];
}

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Un solo estado controla qué modal está abierto (nunca dos a la vez):
  // tipo: null | "paciente" | "alimentos"
  const [modal, setModal] = useState({ tipo: null, paciente: null });

  useEffect(() => {
    cargarPacientes();
  }, []);

  async function cargarPacientes() {
    setCargando(true);
    setError("");
    try {
      const data = await listarPacientes();
      setPacientes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Seguro que deseas eliminar este paciente?")) return;
    try {
      await eliminarPaciente(id);
      cargarPacientes();
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirModalCrear() {
    setModal({ tipo: "paciente", paciente: null }); // asegura que el form empiece vacío
  }

  function abrirModalEditar(paciente) {
    setModal({ tipo: "paciente", paciente });
  }

  function abrirModalAlimentos(paciente) {
    setModal({ tipo: "alimentos", paciente });
  }

  function abrirModalMenu(paciente) {
    setModal({ tipo: "menu", paciente });
  }

  function abrirModalSeguimiento(paciente) {
    setModal({ tipo: "seguimiento", paciente });
  }

  function cerrarModal() {
    setModal({ tipo: null, paciente: null });
  }

  function handleSuccessFormularioPaciente() {
    cerrarModal();
    cargarPacientes();
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  const tituloModal =
    modal.tipo === "paciente"
      ? modal.paciente
        ? "Editar paciente"
        : "Nuevo paciente"
      : modal.tipo === "alimentos"
        ? `Alimentos de ${modal.paciente?.nombre}`
        : modal.tipo === "menu"
          ? `Menú de ${modal.paciente?.nombre}`
          : modal.tipo === "seguimiento"
            ? `Seguimiento de ${modal.paciente?.nombre}`
            : "";

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-nutri-teal">
            Panel principal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-nutri-navy sm:text-4xl">
            Pacientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Consulta perfiles, gestiona alimentos y acompaña el progreso de cada paciente.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-nutri-teal px-5 py-3 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-nutri-navy hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nutri-teal/40 sm:w-auto"
        >
          <IconPlus />
          Nuevo paciente
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <label
          htmlFor="buscar-pacientes"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Buscar paciente
        </label>
        <div className="relative max-w-2xl">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="buscar-pacientes"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-nutri-navy outline-none transition focus:border-nutri-teal focus:bg-white focus:ring-4 focus:ring-nutri-teal/10"
          />
        </div>
      </section>

      {error && (
        <p className="mt-5 rounded-xl bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="my-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nutri-teal/10 text-nutri-teal">
            <IconUsers />
        </div>
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {busqueda.trim() ? "Resultados" : "Total pacientes"}
            </p>
            <p className="text-xl font-bold text-nutri-navy">
              {busqueda.trim() ? pacientesFiltrados.length : pacientes.length}
            </p>
        </div>
      </div>

      {pacientes.length === 0 ? (
        <p className="text-gray-500">
          Todavía no tienes pacientes registrados.
        </p>
      ) : pacientesFiltrados.length === 0 ? (
        <p className="text-gray-500">
          Ningún paciente coincide con "{busqueda}".
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {pacientesFiltrados.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full ${colorAvatar(p.id)} text-white flex items-center justify-center font-semibold shrink-0`}
                >
                  {iniciales(p.nombre)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-nutri-navy truncate">
                    {p.nombre}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    Objetivo: {p.objetivo} · {p.numeroComidas} comidas/día
                  </p>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                  <IconScale className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                      Peso
                    </p>
                    <p className="text-sm font-medium text-nutri-navy truncate">
                      {p.peso} kg
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                  <IconRuler className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                      Altura
                    </p>
                    <p className="text-sm font-medium text-nutri-navy truncate">
                      {p.altura} m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                  <IconActivity className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">
                      Actividad
                    </p>
                    <p className="text-sm font-medium text-nutri-navy truncate">
                      {p.nivelActividad}
                    </p>
                  </div>
                </div>
              </div>

              {p.restricciones && (
                <div
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs mb-2 ${
                    sinRestricciones(p.restricciones)
                      ? "bg-gray-50 text-gray-500"
                      : "bg-nutri-orange/10 text-nutri-orange"
                  }`}
                >
                  <IconAlertTriangle className="shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Restricciones: </span>
                    {p.restricciones}
                  </span>
                </div>
              )}

              {p.preferencias && (
                <div className="flex items-start gap-2 bg-nutri-teal/10 text-nutri-teal rounded-lg px-3 py-2 text-xs mb-3">
                  <IconLeaf className="shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Preferencias: </span>
                    {p.preferencias}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1 border-t border-gray-100 pt-3 sm:grid-cols-5">
                <button
                  onClick={() => abrirModalAlimentos(p)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-nutri-navy hover:bg-gray-50 text-xs"
                >
                  <IconFork />
                  Alimentos
                </button>
                <button
                  onClick={() => abrirModalMenu(p)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-nutri-navy hover:bg-gray-50 text-xs"
                >
                  <IconList />
                  Menú
                </button>
                <button
                  onClick={() => abrirModalSeguimiento(p)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-nutri-navy hover:bg-gray-50 text-xs"
                >
                  <IconCalendarCheck />
                  Seguimiento
                </button>
                <button
                  onClick={() => abrirModalEditar(p)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-nutri-teal hover:bg-gray-50 text-xs"
                >
                  <IconPencil />
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(p.id)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-nutri-pink hover:bg-gray-50 text-xs"
                >
                  <IconTrash />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.tipo !== null}
        onClose={cerrarModal}
        title={tituloModal}
        ancho={
          modal.tipo === "menu" || modal.tipo === "alimentos"
            ? "max-w-5xl"
            : modal.tipo === "seguimiento"
              ? "max-w-2xl"
              : "max-w-lg"
        }
      >
        {modal.tipo === "paciente" && (
          <FormularioPaciente
            pacienteEditar={modal.paciente}
            onSuccess={handleSuccessFormularioPaciente}
            onCancel={cerrarModal}
          />
        )}
        {modal.tipo === "alimentos" && modal.paciente && (
          <ListaAlimentos
            idPaciente={modal.paciente.id}
            paciente={modal.paciente}
          />
        )}
        {modal.tipo === "menu" && modal.paciente && (
          <MenuPaciente
            idPaciente={modal.paciente.id}
            presupuesto={modal.paciente.presupuesto}
          />
        )}
        {modal.tipo === "seguimiento" && modal.paciente && (
          <SeguimientoPaciente idPaciente={modal.paciente.id} />
        )}
      </Modal>
    </div>
  );
}

export default Pacientes;

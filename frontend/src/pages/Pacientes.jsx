import { useState, useEffect } from "react";
import { listarPacientes, eliminarPaciente } from "../services/pacienteService";
import Modal from "../components/Modal";
import FormularioPaciente from "../components/FormularioPaciente";
import ListaAlimentos from "../components/ListaAlimentos";
import MenuPaciente from "../components/MenuPaciente";
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

function Pacientes({ busqueda = "" }) {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  function cerrarModal() {
    setModal({ tipo: null, paciente: null });
  }

  function handleSuccessFormularioPaciente() {
    cerrarModal();
    cargarPacientes();
  }

  if (cargando) return <p className="p-6">Cargando pacientes...</p>;

  const tituloModal =
    modal.tipo === "paciente"
      ? modal.paciente
        ? "Editar paciente"
        : "Nuevo paciente"
      : modal.tipo === "alimentos"
        ? `Alimentos de ${modal.paciente?.nombre}`
        : modal.tipo === "menu"
          ? `Menú de ${modal.paciente?.nombre}`
          : "";

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nutri-navy">Mis Pacientes</h1>
          <p className="text-gray-500 mt-1">
            Gestiona el progreso y los planes de tu comunidad.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-nutri-teal text-white px-4 py-2.5 rounded-lg font-medium hover:bg-nutri-navy transition-colors"
        >
          <IconPlus />
          Nuevo paciente
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-nutri-teal/10 text-nutri-teal flex items-center justify-center">
            <IconUsers />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 tracking-wide">
              TOTAL PACIENTES
            </p>
            <p className="text-2xl font-bold text-nutri-navy">
              {pacientes.length}
            </p>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pacientesFiltrados.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm p-5"
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

              <div className="grid grid-cols-3 gap-2 mb-3">
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

              <div className="grid grid-cols-4 gap-1 pt-3 border-t border-gray-100">
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
        ancho={modal.tipo === "menu" ? "max-w-5xl" : "max-w-lg"}
      >
        {modal.tipo === "paciente" && (
          <FormularioPaciente
            pacienteEditar={modal.paciente}
            onSuccess={handleSuccessFormularioPaciente}
            onCancel={cerrarModal}
          />
        )}
        {modal.tipo === "alimentos" && modal.paciente && (
          <ListaAlimentos idPaciente={modal.paciente.id} />
        )}
        {modal.tipo === "menu" && modal.paciente && (
          <MenuPaciente
            idPaciente={modal.paciente.id}
            presupuesto={modal.paciente.presupuesto}
          />
        )}
      </Modal>
    </div>
  );
}

export default Pacientes;

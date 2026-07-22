import { useState, useEffect } from "react";
import { listarPacientes, eliminarPaciente } from "../services/pacienteService";
import Modal from "../components/Modal";
import FormularioPaciente from "../components/FormularioPaciente";
import ListaAlimentos from "../components/ListaAlimentos";
import MenuPaciente from "../components/MenuPaciente";

function Pacientes() {
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Pacientes</h1>
        <button
          onClick={abrirModalCrear}
          className="bg-nutri-teal text-white px-4 py-2 rounded hover:bg-nutri-navy"
        >
          + Nuevo paciente
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      {pacientes.length === 0 ? (
        <p className="text-gray-500">
          Todavía no tienes pacientes registrados.
        </p>
      ) : (
        <div className="grid gap-4">
          {pacientes.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{p.nombre}</p>
                <p className="text-sm text-gray-500">
                  Objetivo: {p.objetivo} · {p.numeroComidas} comidas/día
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => abrirModalAlimentos(p)}
                  className="text-nutri-navy hover:opacity-70 text-sm"
                >
                  Alimentos
                </button>
                <button
                  onClick={() => abrirModalMenu(p)}
                  className="text-nutri-navy hover:opacity-70 text-sm"
                >
                  Menú
                </button>
                <button
                  onClick={() => abrirModalEditar(p)}
                  className="text-nutri-teal hover:opacity-70 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(p.id)}
                  className="text-nutri-pink hover:opacity-70 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal.tipo !== null} onClose={cerrarModal} title={tituloModal}>
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
          <MenuPaciente idPaciente={modal.paciente.id} />
        )}
      </Modal>
    </div>
  );
}

export default Pacientes;

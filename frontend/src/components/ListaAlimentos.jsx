import { useState, useEffect } from "react";
import {
  listarAlimentos,
  eliminarAlimento,
} from "../services/alimentoService";
import FormularioAlimento from "./FormularioAlimento";

// Gestiona los alimentos de un paciente dentro del modal "Alimentos".
// Alterna entre vista de lista y vista de formulario con un estado local:
// evita abrir un segundo <Modal> apilado sobre el que ya está abierto.
function ListaAlimentos({ idPaciente }) {
  const [alimentos, setAlimentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("lista"); // "lista" | "formulario"
  const [alimentoEditar, setAlimentoEditar] = useState(null); // null = modo crear

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
    setVista("formulario");
  }

  function abrirFormularioEditar(alimento) {
    setAlimentoEditar(alimento);
    setVista("formulario");
  }

  function handleSuccessFormulario() {
    setVista("lista");
    setAlimentoEditar(null);
    cargarAlimentos();
  }

  function handleCancelFormulario() {
    setVista("lista");
    setAlimentoEditar(null);
  }

  if (vista === "formulario") {
    return (
      <FormularioAlimento
        idPaciente={idPaciente}
        alimentoEditar={alimentoEditar}
        onSuccess={handleSuccessFormulario}
        onCancel={handleCancelFormulario}
      />
    );
  }

  if (cargando) return <p>Cargando alimentos...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Alimentos</h2>
        <button
          onClick={abrirFormularioCrear}
          className="bg-nutri-teal text-white px-3 py-1 rounded text-sm hover:bg-nutri-navy"
        >
          + Nuevo alimento
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">
          {error}
        </p>
      )}

      {alimentos.length === 0 ? (
        <p className="text-gray-500">
          Este paciente todavía no tiene alimentos registrados.
        </p>
      ) : (
        <div className="grid gap-2">
          {alimentos.map((a) => (
            <div
              key={a.id}
              className="bg-gray-50 p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{a.nombre}</p>
                <p className="text-sm text-gray-500">
                  {a.cantidad} {a.unidadMedida} · {Number(a.precio).toFixed(2)}$/
                  {a.unidadMedida}
                </p>
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
  );
}

export default ListaAlimentos;

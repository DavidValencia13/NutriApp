import { useState, useEffect } from "react";
import {
  listarAlimentos,
  eliminarAlimento,
} from "../services/alimentoService";
import FormularioAlimento from "./FormularioAlimento";
import { IconAlertTriangle, IconLeaf } from "./Icons";

function sinRestricciones(texto) {
  return /^(ninguna?|no aplica|n\/a|-)$/i.test(texto.trim());
}

// Gestiona los alimentos de un paciente dentro del modal "Alimentos".
// Alterna entre vista de lista y vista de formulario con un estado local:
// evita abrir un segundo <Modal> apilado sobre el que ya está abierto.
function ListaAlimentos({ idPaciente, paciente }) {
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

  // Perfil del paciente: se muestra siempre (lista y formulario) para que
  // el nutriólogo tenga presente restricciones/preferencias/objetivo al
  // registrar o editar alimentos, no solo al verlos en la lista.
  const perfilPaciente = paciente && (
    <div className="mb-4">
      <p className="text-sm text-gray-500 mb-2">
        <span className="font-semibold text-nutri-navy">Objetivo:</span>{" "}
        {paciente.objetivo}
      </p>
      {paciente.restricciones && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs mb-2 ${
            sinRestricciones(paciente.restricciones)
              ? "bg-gray-50 text-gray-500"
              : "bg-nutri-orange/10 text-nutri-orange"
          }`}
        >
          <IconAlertTriangle className="shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">Restricciones: </span>
            {paciente.restricciones}
          </span>
        </div>
      )}
      {paciente.preferencias && (
        <div className="flex items-start gap-2 bg-nutri-teal/10 text-nutri-teal rounded-lg px-3 py-2 text-xs">
          <IconLeaf className="shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">Preferencias: </span>
            {paciente.preferencias}
          </span>
        </div>
      )}
    </div>
  );

  if (vista === "formulario") {
    return (
      <div>
        {perfilPaciente}
        <FormularioAlimento
          idPaciente={idPaciente}
          alimentoEditar={alimentoEditar}
          onSuccess={handleSuccessFormulario}
          onCancel={handleCancelFormulario}
        />
      </div>
    );
  }

  if (cargando) return <p>Cargando alimentos...</p>;

  return (
    <div>
      {perfilPaciente}

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
                  {a.cantidad} {a.unidadMedida} · $
                  {(Number(a.precio) * Number(a.cantidad)).toFixed(2)} total (
                  {Number(a.precio).toFixed(4)}$/{a.unidadMedida})
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

import { useState, useEffect } from "react";
import { generarMenu, obtenerMenu, aprobarMenu } from "../services/menuService";
import { listarRecomendaciones } from "../services/recomendacionService";
import Modal from "./Modal";
import FormularioAjustarComida from "./FormularioAjustarComida";

function MenuPaciente({ idPaciente }) {
  const [menu, setMenu] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [comidaEditar, setComidaEditar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [idPaciente]);

  async function cargarDatos() {
    setCargando(true);
    setError("");
    try {
      const [menuData, recomendacionesData] = await Promise.all([
        obtenerMenu(idPaciente),
        listarRecomendaciones(idPaciente),
      ]);
      setMenu(menuData);
      setRecomendaciones(recomendacionesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleGenerar() {
    setError("");
    try {
      await generarMenu(idPaciente);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAprobar() {
    if (!menu) return;
    try {
      const menuActualizado = await aprobarMenu(idPaciente, menu.id);
      setMenu(menuActualizado);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSuccessAjuste() {
    setComidaEditar(null);
    cargarDatos();
  }

  if (cargando) return <p>Cargando menú...</p>;

  return (
    <div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      <button
        onClick={handleGenerar}
        className="bg-nutri-teal text-white px-4 py-2 rounded hover:bg-nutri-navy mb-4"
      >
        Generar menú semanal
      </button>

      {!menu ? (
        <p className="text-gray-500">
          Este paciente todavía no tiene un menú generado.
        </p>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Estado: <strong>{menu.estado}</strong>
            {menu.estado === "generado" && (
              <button
                onClick={handleAprobar}
                className="ml-4 text-nutri-teal underline text-sm"
              >
                Aprobar menú
              </button>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(menu.dias || []).map((dia) => (
              <div
                key={dia.id}
                className="border rounded-lg shadow-sm overflow-hidden"
              >
                <div className="bg-nutri-teal text-white px-4 py-2 flex justify-between items-center">
                  <span className="font-semibold">Día {dia.numeroDia}</span>
                  <span className="text-sm">{dia.caloriasTotales} kcal</span>
                </div>
                <div className="divide-y">
                  {(dia.comidas || []).map((comida) => (
                    <div key={comida.id} className="p-3">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium">
                          {comida.tipoComida}: {comida.nombrePlato}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {comida.calorias} kcal
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(comida.detalles || [])
                          .map(
                            (d) =>
                              `${d.nombreAlimento} (${d.cantidadUtilizada}${d.unidadMedida})`,
                          )
                          .join(", ")}
                      </p>
                      {menu.estado === "generado" && (
                        <button
                          onClick={() => setComidaEditar(comida)}
                          className="text-nutri-teal text-xs underline mt-1"
                        >
                          Ajustar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recomendaciones.length > 0 && (
        <div className="mt-4">
          <p className="font-semibold">Recomendaciones</p>
          <ul className="list-disc ml-5 text-sm">
            {recomendaciones.map((r) => (
              <li key={r.id}>{r.texto}</li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={comidaEditar !== null}
        onClose={() => setComidaEditar(null)}
        title="Ajustar comida"
      >
        {comidaEditar && (
          <FormularioAjustarComida
            idPaciente={idPaciente}
            comida={comidaEditar}
            onSuccess={handleSuccessAjuste}
            onCancel={() => setComidaEditar(null)}
          />
        )}
      </Modal>
    </div>
  );
}

export default MenuPaciente;

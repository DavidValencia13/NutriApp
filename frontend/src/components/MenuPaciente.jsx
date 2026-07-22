import { useState, useEffect } from "react";
import { generarMenu, obtenerMenu, aprobarMenu } from "../services/menuService";
import { listarRecomendaciones } from "../services/recomendacionService";

function MenuPaciente({ idPaciente }) {
  const [menu, setMenu] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
          <p className="text-sm text-gray-600 mb-2">
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

          {(menu.dias_menus || []).map((dia) => (
            <div key={dia.id} className="border rounded p-3 mb-2">
              <p className="font-semibold">
                Día {dia.numeroDia} — {dia.caloriasTotales} kcal
              </p>
              {(dia.comidas_menus || []).map((comida) => (
                <div key={comida.id} className="ml-3 text-sm">
                  {comida.tipoComida} ({comida.calorias} kcal):{" "}
                  {(comida.detalle_comida_alimentos || [])
                    .map(
                      (d) =>
                        `${d.nombreAlimento} (${d.cantidadUtilizada}${d.unidadMedida})`,
                    )
                    .join(", ")}
                </div>
              ))}
            </div>
          ))}
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
    </div>
  );
}

export default MenuPaciente;

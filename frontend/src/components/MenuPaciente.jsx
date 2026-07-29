import { useState, useEffect } from "react";
import { generarMenu, obtenerMenu, aprobarMenu } from "../services/menuService";
import { listarRecomendaciones } from "../services/recomendacionService";
import Modal from "./Modal";
import FormularioAjustarComida from "./FormularioAjustarComida";
import AlertasMenu from "./AlertasMenu";
import SugerenciasMenu from "./SugerenciasMenu";
import CumplimientoMenu from "./CumplimientoMenu";
import EfectividadMenu from "./EfectividadMenu";
import ReporteNutricional from "./ReporteNutricional";
import { IconAlertTriangle } from "./Icons";

// Un solo emoji por momento del día (desayuno/almuerzo/cena/merienda) — se
// quitaron los emojis por ingrediente (🥩🍗🥚...) porque adivinar uno solo a
// partir del nombre del plato no reflejaba bien platos con varios
// ingredientes.
const ICONOS_POR_MOMENTO = [
  [/desayuno/, "☀️"],
  [/almuerzo/, "🌤️"],
  [/cena/, "🌙"],
  [/merienda|snack/, "🍪"],
];

function iconoMomento(tipoComida) {
  const texto = (tipoComida || "").toLowerCase();
  const match = ICONOS_POR_MOMENTO.find(([regex]) => regex.test(texto));
  return match ? match[1] : "🍽️";
}

function MenuPaciente({ idPaciente, presupuesto }) {
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

  async function handleAprobar(confirmarAdvertencias = false) {
    if (!menu) return;
    setError("");
    try {
      const resultado = await aprobarMenu(idPaciente, menu.id, confirmarAdvertencias);

      // requiereConfirmacion=true: el backend NO aprobó, solo detectó
      // advertencias (no críticas) pendientes. Se le pregunta al
      // nutriólogo si de todas formas quiere continuar (RF punto 6).
      if (resultado.requiereConfirmacion) {
        const detalle = (resultado.advertencias || [])
          .map((a) => `- ${a.mensaje}`)
          .join("\n");
        const continuar = confirm(
          `El menú tiene advertencias nutricionales pendientes:\n\n${detalle}\n\n¿Deseas aprobarlo de todas formas?`,
        );
        if (continuar) await handleAprobar(true);
        return;
      }

      // resultado.menu (no resultado) porque aprobarMenu() devuelve el Menu
      // sin dias/comidas anidados (esa forma resumida solo trae
      // id/estado/fechas). Se recarga con cargarDatos() para no perder el
      // árbol completo (y con él, el costo del menú).
      await cargarDatos();
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
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                menu.estado === "aprobado"
                  ? "bg-nutri-green/15 text-nutri-green"
                  : "bg-nutri-orange/15 text-nutri-orange"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  menu.estado === "aprobado" ? "bg-nutri-green" : "bg-nutri-orange"
                }`}
              />
              {menu.estado === "aprobado" ? "Aprobado" : "Generado · pendiente de aprobar"}
            </span>
            {menu.estado === "generado" && (
              <button
                onClick={() => handleAprobar()}
                className="bg-nutri-teal text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-nutri-navy transition-colors"
              >
                Aprobar menú
              </button>
            )}
            <span className="ml-auto">
              <ReporteNutricional idPaciente={idPaciente} idMenu={menu.id} />
            </span>
          </div>

          <EfectividadMenu idPaciente={idPaciente} idMenu={menu.id} />

          <AlertasMenu idPaciente={idPaciente} idMenu={menu.id} onCambio={cargarDatos} />

          <SugerenciasMenu idPaciente={idPaciente} idMenu={menu.id} />

          <CumplimientoMenu idPaciente={idPaciente} idMenu={menu.id} dias={menu.dias} />

          {presupuesto !== undefined && (
            <ResumenPresupuesto dias={menu.dias || []} presupuesto={presupuesto} />
          )}

          {menu.resumenNutricionalSemanal && (
            <ResumenNutricional resumen={menu.resumenNutricionalSemanal} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(menu.dias || []).map((dia, indiceDia) => (
              <div
                key={dia.id}
                className="border rounded-lg shadow-sm overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${indiceDia * 60}ms` }}
              >
                <div className="bg-nutri-teal text-white px-4 py-2 flex justify-between items-center">
                  <span className="font-semibold">Día {dia.numeroDia}</span>
                  <span className="text-sm text-right">
                    {dia.caloriasTotales} kcal
                    {dia.nutrientes?.nutrientes && (
                      <>
                        <br />
                        <span className="text-xs opacity-80">
                          P:{Math.round(dia.nutrientes.nutrientes.proteinas || 0)}g · C:
                          {Math.round(dia.nutrientes.nutrientes.carbohidratos || 0)}g · G:
                          {Math.round(dia.nutrientes.nutrientes.grasasTotales || 0)}g
                        </span>
                      </>
                    )}
                    <br />
                    <span className="text-xs opacity-80">
                      {Number(dia.costoTotalDia || 0).toFixed(2)}$
                    </span>
                  </span>
                </div>
                <div className="divide-y">
                  {(dia.comidas || []).map((comida) => (
                    <div
                      key={comida.id}
                      className="p-3 flex gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className="text-xl leading-none shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        {iconoMomento(comida.tipoComida)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium">
                            {comida.tipoComida}: {comida.nombrePlato}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2 text-right">
                            {comida.nutrientes?.completo === false && (
                              <span
                                title="Información nutricional incompleta para esta comida (falta info nutricional en alguno de sus alimentos)"
                                className="inline-flex text-nutri-orange mr-1 align-middle"
                              >
                                <IconAlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {comida.calorias} kcal
                            <br />
                            {Number(comida.costoTotal || 0).toFixed(2)}$
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

function ResumenPresupuesto({ dias, presupuesto }) {
  const costoTotal = dias.reduce(
    (total, dia) => total + Number(dia.costoTotalDia || 0),
    0,
  );
  const excedido = costoTotal > presupuesto;
  const porcentaje = presupuesto > 0
    ? Math.min((costoTotal / presupuesto) * 100, 100)
    : 0;

  // El estado arranca en 0 (valor inicial de useState) y el efecto lo mueve
  // al valor real un frame después, para que la barra "se llene" al montar
  // en vez de aparecer ya completa. En actualizaciones posteriores, el mismo
  // efecto simplemente hace una transición suave del valor viejo al nuevo.
  const [anchoAnimado, setAnchoAnimado] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnchoAnimado(porcentaje));
    return () => cancelAnimationFrame(id);
  }, [porcentaje]);

  return (
    <div
      className={`rounded-lg p-3 mb-4 border ${
        excedido
          ? "bg-nutri-pink/10 border-nutri-pink/30"
          : "bg-nutri-teal/10 border-nutri-teal/30"
      }`}
    >
      <div className="flex justify-between items-baseline text-sm mb-1.5">
        <span className="font-medium text-nutri-navy">
          Costo del menú semanal
        </span>
        <span className={excedido ? "text-nutri-pink font-semibold" : "text-nutri-teal font-semibold"}>
          {costoTotal.toFixed(2)}$ / {Number(presupuesto).toFixed(2)}$
        </span>
      </div>
      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            excedido ? "bg-nutri-pink" : "bg-nutri-teal"
          }`}
          style={{ width: `${anchoAnimado}%` }}
        />
      </div>
      {excedido && (
        <p className="text-xs text-nutri-pink mt-1.5">
          El menú excede el presupuesto del paciente por{" "}
          {(costoTotal - presupuesto).toFixed(2)}$.
        </p>
      )}
    </div>
  );
}

// Resumen de los "4 grandes" (calorías + macros) de toda la semana. Se
// mantiene simple a propósito (no los 16 nutrientes) para no saturar la
// interfaz — el detalle completo por comida ya está disponible al ajustar.
function ResumenNutricional({ resumen }) {
  const n = resumen.nutrientes || {};
  const items = [
    { label: "Calorías", valor: n.calorias, unidad: "kcal" },
    { label: "Proteínas", valor: n.proteinas, unidad: "g" },
    { label: "Carbohidratos", valor: n.carbohidratos, unidad: "g" },
    { label: "Grasas totales", valor: n.grasasTotales, unidad: "g" },
    { label: "Grasas saturadas", valor: n.grasasSaturadas, unidad: "g" },
    { label: "Fibra", valor: n.fibra, unidad: "g" },
    { label: "Azúcares", valor: n.azucares, unidad: "g" },
    { label: "Sodio", valor: n.sodio, unidad: "mg" },
    { label: "Potasio", valor: n.potasio, unidad: "mg" },
    { label: "Calcio", valor: n.calcio, unidad: "mg" },
    { label: "Hierro", valor: n.hierro, unidad: "mg" },
    { label: "Magnesio", valor: n.magnesio, unidad: "mg" },
  ];

  if (items.every((i) => i.valor === undefined)) return null;

  return (
    <div className="rounded-lg p-3 mb-4 border bg-nutri-teal/10 border-nutri-teal/30">
      <div className="flex justify-between items-baseline text-sm mb-2">
        <span className="font-medium text-nutri-navy">
          Resumen nutricional semanal
        </span>
        {!resumen.completo && (
          <span className="text-xs text-nutri-orange">
            Datos incompletos (faltan valores en algunos alimentos)
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center">
        {items.map((i) => (
          <div key={i.label} className="bg-white rounded-lg py-2 px-1">
            <p className="text-[11px] text-gray-500 leading-tight">{i.label}</p>
            <p className="text-sm font-semibold text-nutri-navy">
              {i.valor !== undefined ? `${Math.round(i.valor)} ${i.unidad}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuPaciente;

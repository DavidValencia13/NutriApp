import { useState, useEffect } from "react";
import { generarMenu, obtenerMenu, aprobarMenu } from "../services/menuService";
import { listarRecomendaciones } from "../services/recomendacionService";
import Modal from "./Modal";
import FormularioAjustarComida from "./FormularioAjustarComida";

// No hay fotos reales de platos: se infiere un emoji representativo a partir
// del nombre del platillo y sus ingredientes, para que cada tarjeta tenga una
// identidad visual sin depender de imágenes externas.
const ICONOS_POR_PALABRA_CLAVE = [
  [/res|chancho|cerdo|cordero|carne/, "🥩"],
  [/pollo|gallina|pavo/, "🍗"],
  [/pescado|atún|salmón|tilapia|mariscos|camar/, "🐟"],
  [/huevo/, "🥚"],
  [/leche|yogur|queso|lácte/, "🥛"],
  [/arroz/, "🍚"],
  [/pan|tostada/, "🍞"],
  [/papa|patata/, "🥔"],
  [/fideo|pasta|espagueti/, "🍝"],
  [/avena/, "🥣"],
  [/frijol|lenteja|garbanzo/, "🫘"],
  [/lechuga|ensalada|espinaca|verdura|vegetal|tomate|brócoli/, "🥗"],
  [/manzana|banana|plátano|naranja|fruta/, "🍎"],
];

function iconoAlimento(nombrePlato, detalles) {
  const texto = `${nombrePlato} ${(detalles || [])
    .map((d) => d.nombreAlimento)
    .join(" ")}`.toLowerCase();
  const match = ICONOS_POR_PALABRA_CLAVE.find(([regex]) => regex.test(texto));
  return match ? match[1] : "🍽️";
}

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

  async function handleAprobar() {
    if (!menu) return;
    try {
      // aprobarMenu() devuelve el Menu sin dias/comidas anidados (esa forma
      // resumida solo trae id/estado/fechas). Se recarga con cargarDatos()
      // para no perder el árbol completo (y con él, el costo del menú).
      await aprobarMenu(idPaciente, menu.id);
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
                onClick={handleAprobar}
                className="bg-nutri-teal text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-nutri-navy transition-colors"
              >
                Aprobar menú
              </button>
            )}
          </div>

          {presupuesto !== undefined && (
            <ResumenPresupuesto dias={menu.dias || []} presupuesto={presupuesto} />
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
                        {iconoAlimento(comida.nombrePlato, comida.detalles)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium">
                            <span aria-hidden="true">
                              {iconoMomento(comida.tipoComida)}
                            </span>{" "}
                            {comida.tipoComida}: {comida.nombrePlato}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2 text-right">
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

export default MenuPaciente;

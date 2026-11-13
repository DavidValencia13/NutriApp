import { useState, useEffect } from "react";
import { generarMenu, obtenerMenu, aprobarMenu } from "../services/menuService";
import { obtenerCoberturaCatalogo } from "../services/alimentoService";
import SuficienciaAlimentos from "./SuficienciaAlimentos";
import { faltanAlimentos } from "../utils/suficiencia";
import Modal from "./Modal";
import FormularioAjustarComida from "./FormularioAjustarComida";
import EfectividadMenu from "./EfectividadMenu";
import { IconAlertTriangle } from "./Icons";
import {
  Apple, Check, Coffee, Loader2, Moon, MoonStar, Sparkles, Sunrise, Utensils, UtensilsCrossed,
} from "lucide-react";

// Pasos que sigue el backend al generar el menú (se muestran mientras espera)
const PASOS_GENERACION = [
  "Revisando los alimentos y cantidades del paciente",
  "Diseñando los platos de la semana con IA",
  "Calculando calorías y nutrientes con las tablas de referencia",
  "Ajustando porciones a la meta y al presupuesto",
];

// Avanza los pasos con el tiempo; el último se queda activo hasta que termine
function usePasoGeneracion(activo) {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => {
      clearInterval(id);
      setSegundos(0);
    };
  }, [activo]);
  const paso = segundos < 3 ? 0 : segundos < 25 ? 1 : segundos < 35 ? 2 : 3;
  return { paso, segundos };
}

function PanelGenerando({ paso, segundos }) {
  return (
    <div className="mb-4 rounded-xl border border-nutri-brand/20 bg-white p-4 shadow-sm animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-nutri-ink">
          <Sparkles size={16} className="text-nutri-brand" aria-hidden="true" />
          Preparando el menú semanal
        </p>
        <span className="text-xs text-gray-500 tabular">{segundos}s</span>
      </div>
      <div className="progreso-indef h-1 rounded-full mb-4" />
      <ol className="space-y-2">
        {PASOS_GENERACION.map((texto, i) => {
          const hecho = i < paso;
          const actual = i === paso;
          return (
            <li key={texto} className="flex items-center gap-2.5 text-sm">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-colors ${
                  hecho ? "bg-nutri-brand text-white" : actual ? "bg-nutri-brand/15 text-nutri-brand" : "bg-gray-100 text-gray-400"
                }`}
              >
                {hecho ? (
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                ) : actual ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={hecho ? "text-gray-500" : actual ? "text-nutri-ink font-medium" : "text-gray-400"}>
                {texto}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-gray-500 mt-3">Suele tardar entre 30 segundos y un minuto.</p>
    </div>
  );
}

// Tarjetas de día vacías con brillo mientras llega el menú
function EsqueletoMenu() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden bg-white" style={{ opacity: 1 - i * 0.1 }}>
          <div className="esqueleto h-10" style={{ background: "rgb(31 122 82 / 0.15)" }} />
          <div className="p-4 space-y-4">
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-2">
                <div className="esqueleto h-3 w-24 rounded" />
                <div className="esqueleto h-4 w-4/5 rounded" />
                <div className="esqueleto h-3 w-3/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Ícono de línea (Lucide) por momento del día
const ICONOS_POR_MOMENTO = [
  [/desayuno/, Sunrise],
  [/media ma/, Apple],
  [/almuerzo/, UtensilsCrossed],
  [/merienda/, Coffee],
  [/antes de dormir/, MoonStar],
  [/cena/, Moon],
];

function IconoMomento({ tipoComida }) {
  const texto = (tipoComida || "").toLowerCase();
  const Icono = ICONOS_POR_MOMENTO.find(([regex]) => regex.test(texto))?.[1] || Utensils;
  return (
    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-nutri-brand/10 text-nutri-brand shrink-0">
      <Icono size={14} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

// Cantidad legible para el paciente: kg y l se muestran en g y ml
// ("0.25 l" -> "250 ml"), y sin decimales sobrantes ("1.00" -> "1")
function cantidadLegible(cantidad, unidad) {
  const n = Number(cantidad);
  const formato = (valor) => String(Math.round(valor * 100) / 100);
  if (unidad === "kg") return `${formato(n * 1000)} g`;
  if (unidad === "l") return `${formato(n * 1000)} ml`;
  if (unidad === "unidad") return formato(n);
  return `${formato(n)} ${unidad}`;
}

function MenuPaciente({ idPaciente, presupuesto }) {
  const [menu, setMenu] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [comidaEditar, setComidaEditar] = useState(null);
  // Cobertura del catálogo: si los alimentos alcanzan para la meta del
  // paciente (y la meta misma, para comparar cada día)
  const [cobertura, setCobertura] = useState(null);
  const { paso, segundos } = usePasoGeneracion(generando);

  useEffect(() => {
    cargarDatos();
  }, [idPaciente]);

  async function cargarDatos() {
    setCargando(true);
    setError("");
    try {
      const [menuData, coberturaData] = await Promise.all([
        obtenerMenu(idPaciente),
        obtenerCoberturaCatalogo(idPaciente).catch(() => null),
      ]);
      setMenu(menuData);
      setCobertura(coberturaData);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleGenerar() {
    if (generando) return;
    setError("");
    setGenerando(true);
    try {
      await generarMenu(idPaciente);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }

  async function handleAprobar() {
    if (!menu) return;
    setError("");
    try {
      await aprobarMenu(idPaciente, menu.id);
      // Se recarga con cargarDatos() para no perder el árbol completo del
      // menú (aprobarMenu() devuelve el Menu sin dias/comidas anidados).
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSuccessAjuste() {
    setComidaEditar(null);
    cargarDatos();
  }

  if (cargando) {
    return (
      <div>
        <div className="esqueleto h-24 rounded-lg mb-3" />
        <div className="esqueleto h-9 w-48 rounded-lg mb-4" />
        <EsqueletoMenu />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      {/* Antes de generar: ¿alcanzan los alimentos para la meta del paciente? */}
      {cobertura?.suficiencia && (
        <div className="mb-3">
          <SuficienciaAlimentos
            suficiencia={cobertura.suficiencia}
            titulo="Antes de generar: ¿alcanzan los alimentos registrados?"
          />
        </div>
      )}

      <button
        onClick={handleGenerar}
        disabled={generando}
        aria-busy={generando}
        className={`inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium mb-4 transition-colors disabled:cursor-wait ${
          generando ? "boton-generando" : "bg-nutri-brand hover:bg-nutri-ink"
        }`}
      >
        {generando ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Generando menú…
          </>
        ) : (
          <>
            <Sparkles size={16} aria-hidden="true" />
            {faltanAlimentos(cobertura?.suficiencia) ? "Generar menú de todas formas" : "Generar menú semanal"}
          </>
        )}
      </button>

      {generando ? (
        <>
          <PanelGenerando paso={paso} segundos={segundos} />
          <EsqueletoMenu />
        </>
      ) : !menu ? (
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
                className="bg-nutri-brand text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-nutri-ink transition-colors"
              >
                Aprobar menú
              </button>
            )}
          </div>

          <EfectividadMenu idPaciente={idPaciente} idMenu={menu.id} />

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
                <div className="bg-nutri-brand text-white px-4 py-2.5 flex justify-between items-center">
                  <span className="font-semibold">Día {dia.numeroDia}</span>
                  <span className="text-xs opacity-90">{Number(dia.costoTotalDia || 0).toFixed(2)}$</span>
                </div>
                <NutrientesDelDia
                  dia={dia}
                  metaCalorias={cobertura?.suficiencia?.calorias?.requeridoDia}
                  metaProteinas={cobertura?.suficiencia?.proteinas?.requeridoDia}
                />
                <div className="divide-y">
                  {(dia.comidas || []).map((comida) => (
                    <div key={comida.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-xs font-semibold text-nutri-brand">
                            <IconoMomento tipoComida={comida.tipoComida} />
                            {comida.tipoComida}
                          </p>
                          <p className="font-semibold leading-snug mt-1.5">{comida.nombrePlato}</p>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap text-right shrink-0">
                          <span className="inline-flex items-center gap-1">
                            {comida.nutrientes?.completo === false && (
                              <span
                                title="Faltan calorías o macronutrientes de algún alimento: el valor es estimado"
                                className="inline-flex text-nutri-orange"
                              >
                                <IconAlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {Math.round(Number(comida.calorias) || 0)} kcal
                          </span>
                          <br />
                          {Number(comida.costoTotal || 0).toFixed(2)}$
                        </div>
                      </div>
                      {comida.descripcion && (
                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{comida.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {(comida.detalles || [])
                          .map((d) => `${d.nombreAlimento} ${cantidadLegible(d.cantidadUtilizada, d.unidadMedida)}`)
                          .join(" · ")}
                      </p>
                      {menu.estado === "generado" && (
                        <button
                          onClick={() => setComidaEditar(comida)}
                          className="text-nutri-brand text-xs font-medium underline underline-offset-2 mt-2 cursor-pointer"
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

      <Modal
        isOpen={comidaEditar !== null}
        onClose={() => setComidaEditar(null)}
        title="Ajustar comida"
      >
        {comidaEditar && (
          <FormularioAjustarComida
            idPaciente={idPaciente}
            idMenu={menu.id}
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
          : "bg-nutri-brand/10 border-nutri-brand/30"
      }`}
    >
      <div className="flex justify-between items-baseline text-sm mb-1.5">
        <span className="font-medium text-nutri-ink">
          Costo del menú semanal
        </span>
        <span className={excedido ? "text-nutri-pink font-semibold" : "text-nutri-brand font-semibold"}>
          {costoTotal.toFixed(2)}$ / {Number(presupuesto).toFixed(2)}$
        </span>
      </div>
      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            excedido ? "bg-nutri-pink" : "bg-nutri-brand"
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

// Nutrientes que se comerán en el día: calorías frente a la meta, macros
// (proteína frente a su meta) y, al desplegar, minerales y vitaminas.
const MACROS_DIA = [
  { campo: "proteinas", label: "Proteínas", unidad: "g", meta: "proteinas" },
  { campo: "carbohidratos", label: "Carbohidratos", unidad: "g" },
  { campo: "grasasTotales", label: "Grasas", unidad: "g" },
  { campo: "fibra", label: "Fibra", unidad: "g" },
];
const MICROS_DIA = [
  { campo: "grasasSaturadas", label: "Grasas saturadas", unidad: "g" },
  { campo: "azucares", label: "Azúcares", unidad: "g" },
  { campo: "sodio", label: "Sodio", unidad: "mg" },
  { campo: "potasio", label: "Potasio", unidad: "mg" },
  { campo: "calcio", label: "Calcio", unidad: "mg" },
  { campo: "hierro", label: "Hierro", unidad: "mg" },
  { campo: "magnesio", label: "Magnesio", unidad: "mg" },
  { campo: "vitaminaA", label: "Vitamina A", unidad: "µg" },
  { campo: "vitaminaC", label: "Vitamina C", unidad: "mg" },
  { campo: "vitaminaD", label: "Vitamina D", unidad: "µg" },
  { campo: "vitaminaB12", label: "Vitamina B12", unidad: "µg" },
];

function formatoNutriente(valor, unidad) {
  if (valor === undefined || valor === null) return "—";
  const redondeado = valor >= 10 ? Math.round(valor) : Math.round(valor * 10) / 10;
  return `${redondeado} ${unidad}`;
}

function NutrientesDelDia({ dia, metaCalorias, metaProteinas }) {
  const [verMas, setVerMas] = useState(false);
  const n = dia.nutrientes?.nutrientes || {};
  const calorias = Math.round(Number(dia.caloriasTotales) || 0);
  const pctCalorias = metaCalorias ? Math.round((calorias / metaCalorias) * 100) : null;
  const metas = { proteinas: metaProteinas };
  const micros = MICROS_DIA.filter((m) => n[m.campo] !== undefined);

  return (
    <div className="px-4 py-3 bg-nutri-brand/5 border-b">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-nutri-ink tabular">
          {calorias} <span className="text-sm font-normal text-gray-500">kcal</span>
        </span>
        {metaCalorias && (
          <span className="text-xs text-gray-500 tabular">
            meta {metaCalorias} kcal ·{" "}
            {pctCalorias >= 100 ? "meta cumplida ✓" : `${pctCalorias}%`}
          </span>
        )}
      </div>
      {metaCalorias && (
        <div className="h-1.5 w-full rounded-full bg-white overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full ${pctCalorias >= 90 && pctCalorias <= 110 ? "bg-nutri-green" : "bg-nutri-orange"}`}
            style={{ width: `${Math.min(100, pctCalorias)}%` }}
          />
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {MACROS_DIA.map((m) => (
          <div key={m.campo} className="rounded-md bg-white px-1.5 py-1.5 text-center">
            <p className="text-[10px] text-gray-500 leading-tight">{m.label}</p>
            <p className="text-sm font-semibold text-nutri-ink tabular">{formatoNutriente(n[m.campo], m.unidad)}</p>
            {m.meta && metas[m.meta] && n[m.campo] !== undefined && (
              <p className="text-[10px] text-gray-400 tabular">de {metas[m.meta]} g</p>
            )}
          </div>
        ))}
      </div>
      {micros.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setVerMas((v) => !v)}
            className="mt-2 text-xs font-medium text-nutri-brand cursor-pointer"
            aria-expanded={verMas}
          >
            {verMas ? "Ocultar minerales y vitaminas" : "Ver minerales y vitaminas"}
          </button>
          {verMas && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {micros.map((m) => (
                <div key={m.campo} className="flex justify-between border-b border-dashed border-gray-200 py-0.5">
                  <dt className="text-gray-500">{m.label}</dt>
                  <dd className="font-medium text-nutri-ink tabular">{formatoNutriente(n[m.campo], m.unidad)}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
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
    <div className="rounded-lg p-3 mb-4 border bg-nutri-brand/10 border-nutri-brand/30">
      <div className="flex justify-between items-baseline text-sm mb-2">
        <span className="font-medium text-nutri-ink">
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
            <p className="text-sm font-semibold text-nutri-ink">
              {i.valor !== undefined ? `${Math.round(i.valor)} ${i.unidad}` : "—"}
            </p>
            {i.valor !== undefined && (
              <p className="text-[10px] text-gray-400">≈ {formatoNutriente(i.valor / 7, i.unidad)}/día</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuPaciente;

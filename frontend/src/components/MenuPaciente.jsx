import { useState, useEffect, useCallback, useRef } from "react";
import { generarMenu, obtenerMenu, aprobarMenu, listarHistorialMenu, obtenerVersionMenu, generarPreparacion, guardarPreparacion, guardarBebida } from "../services/menuService";
import { EditorPreparacion } from "./PreparacionPlato";
import { EditorBebida, NombreConBebida, TarjetaBebida } from "./BebidaComida";
import RequerimientoNutricional from "./RequerimientoNutricional";
import { aplicarPreparaciones, necesitaPreparacion, separarPasos, tienePreparacion, textoMinutos } from "../utils/preparacion";
import { listarSeguimiento } from "../services/seguimientoService";
import { listarAlimentos, obtenerCoberturaCatalogo } from "../services/alimentoService";
import SuficienciaAlimentos from "./SuficienciaAlimentos";
import { catalogoPreparadoParaMenu, faltanAlimentos } from "../utils/suficiencia";
import Modal from "./Modal";
import FormularioAjustarComida from "./FormularioAjustarComida";
import EfectividadMenu from "./EfectividadMenu";
import ListaAlimentos from "./ListaAlimentos";
import { IconAlertTriangle } from "./Icons";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChefHat, CupSoda, ChevronLeft, ChevronRight, ClipboardCheck, History, Loader2, Smartphone, Sparkles, UtensilsCrossed } from "lucide-react";
import IconoMomento from "./IconoMomento";
import NutriIcon from "./NutriIcon";
import PesoTrendChart from "./PesoTrendChart";
import { ordenarControles } from "../utils/ordenarControles";
import { cantidadLegible } from "../utils/cantidad";
import menuFoodHero from "../assets/menu-food-hero.png";

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

function MenuPaciente({ idPaciente, paciente, presupuesto, vistaInicial = "resumen", onSeguimiento, onAcceso }) {
  const [menu, setMenu] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [versionVista, setVersionVista] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [confirmarNuevaVersion, setConfirmarNuevaVersion] = useState(false);
  const [cantidadAlimentos, setCantidadAlimentos] = useState(0);
  const [vista, setVista] = useState(vistaInicial);
  const [diaSeleccionado, setDiaSeleccionado] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [comidaEditar, setComidaEditar] = useState(null);
  const [comidaPreparacion, setComidaPreparacion] = useState(null);
  const [comidaBebida, setComidaBebida] = useState(null);
  const [explicandoId, setExplicandoId] = useState(null);
  // Cobertura del catálogo: si los alimentos alcanzan para la meta del
  // paciente (y la meta misma, para comparar cada día)
  const [cobertura, setCobertura] = useState(null);
  const { paso, segundos } = usePasoGeneracion(generando);

  // Explicación de preparación automática: al abrir (o generar) un menú, los
  // platos sin explicación se completan solos en segundo plano, en UNA
  // llamada barata a la IA. Cada conjunto de platos se intenta una sola vez.
  const [preparandoTodo, setPreparandoTodo] = useState(false);
  const intentosPreparacion = useRef(new Set());
  useEffect(() => {
    const faltantes = (menu?.dias || []).flatMap((d) => d.comidas || []).filter(necesitaPreparacion).map((c) => `${c.id}${c.bebida ? `+${c.bebida}` : ""}`);
    if (!menu?.id || faltantes.length === 0) return;
    const clave = `${menu.id}:${faltantes.join(",")}`;
    if (intentosPreparacion.current.has(clave)) return;
    intentosPreparacion.current.add(clave);
    let vigente = true;
    queueMicrotask(() => { if (vigente) setPreparandoTodo(true); });
    generarPreparacion(idPaciente, menu.id)
      .then(({ preparaciones }) => {
        setMenu((m) => (m && m.id === menu.id ? aplicarPreparaciones(m, preparaciones) : m));
      })
      .catch(() => { /* queda el botón de cada comida para reintentar */ })
      .finally(() => setPreparandoTodo(false));
    return () => { vigente = false; };
  }, [menu, idPaciente]);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [menuData, coberturaData, alimentosData, historialData] = await Promise.all([
        obtenerMenu(idPaciente),
        obtenerCoberturaCatalogo(idPaciente).catch(() => null),
        listarAlimentos(idPaciente),
        listarHistorialMenu(idPaciente),
      ]);
      setMenu(menuData);
      setHistorial(historialData);
      setCobertura(coberturaData);
      setCantidadAlimentos(alimentosData.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [idPaciente]);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => { if (activo) cargarDatos(); });
    return () => { activo = false; };
  }, [cargarDatos]);

  async function handleGenerar(esNuevaVersion = false) {
    if (generando || !catalogoPreparadoParaMenu(cobertura, cantidadAlimentos)) return;
    setError("");
    setConfirmarNuevaVersion(false);
    setGenerando(true);
    try {
      await generarMenu(idPaciente, { confirmarNuevaVersion: esNuevaVersion, idVersionActual: esNuevaVersion ? menu?.id : null });
      setVersionVista(null);
      setMostrarHistorial(false);
      setDiaSeleccionado(1);
      await cargarDatos();
    } catch (err) {
      setError(err.message === "El servicio de generación no está disponible"
        ? "No se pudo conectar con la IA. Revisa que GROQ_API_KEY esté configurada en el backend y vuelve a intentar."
        : err.message);
    } finally {
      setGenerando(false);
    }
  }

  async function handleAprobar() {
    if (!menu || versionVista) return;
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

  // Explicación de preparación de UNA comida: si ya la tiene se abre; si no,
  // la IA (modelo barato) la escribe y se abre para que el nutricionista la
  // revise. regenerar = rehacerla desde el editor.
  async function handleExplicarComida(comida, regenerar = false) {
    const objetivo = versionVista || menu;
    if (!objetivo || explicandoId) return;
    if (tienePreparacion(comida) && !regenerar) {
      setComidaPreparacion(comida);
      return;
    }
    setError("");
    setExplicandoId(comida.id);
    try {
      const { preparaciones } = await generarPreparacion(idPaciente, objetivo.id, { regenerar, idsComidas: [comida.id] });
      const preparacion = preparaciones[comida.id];
      if (!preparacion) throw new Error("La IA no pudo explicar este plato. Intenta de nuevo.");
      const cambio = { [comida.id]: preparacion };
      if (versionVista) setVersionVista((v) => aplicarPreparaciones(v, cambio));
      else setMenu((m) => aplicarPreparaciones(m, cambio));
      setComidaPreparacion({ ...comida, preparacion });
    } catch (err) {
      setError(err.message);
    } finally {
      setExplicandoId(null);
    }
  }

  async function handleGuardarPreparacion(preparacion) {
    const { preparacion: guardada } = await guardarPreparacion(idPaciente, comidaPreparacion.id, preparacion);
    const cambio = { [comidaPreparacion.id]: guardada };
    if (versionVista) setVersionVista((v) => aplicarPreparaciones(v, cambio));
    else setMenu((m) => aplicarPreparaciones(m, cambio));
    setComidaPreparacion(null);
  }

  // Si la bebida tiene calorías cambian los totales de la comida y del día:
  // se vuelve a traer el menú (sin la pantalla de carga)
  async function handleGuardarBebida(datos) {
    await guardarBebida(idPaciente, comidaBebida.id, datos);
    if (versionVista) setVersionVista(await obtenerVersionMenu(idPaciente, versionVista.id));
    else setMenu(await obtenerMenu(idPaciente));
    setComidaBebida(null);
  }

  function handleSuccessAjuste() {
    setComidaEditar(null);
    cargarDatos();
  }

  function volverDelCatalogo() {
    setVista("resumen");
    cargarDatos();
  }

  async function verVersion(idMenu) {
    if (Number(idMenu) === Number(menu?.id)) {
      setVersionVista(null);
      setDiaSeleccionado(1);
      return;
    }
    setError("");
    try {
      setVersionVista(await obtenerVersionMenu(idPaciente, idMenu));
      setDiaSeleccionado(1);
    } catch (err) {
      setError(err.message);
    }
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

  if (vista === "alimentos") {
    return (
      <div className="menu-flow menu-flow-food-page">
        <button type="button" className="menu-flow-back" onClick={volverDelCatalogo}>
          <ArrowLeft size={16} aria-hidden="true" /> Volver al menú semanal
        </button>
        <div className="menu-flow-food-heading">
          <span className="menu-flow-kicker">PASO 1 · ALIMENTOS</span>
          <h3>Elige los alimentos disponibles</h3>
          <p>Selecciona sugerencias del catálogo o busca un alimento. Los nutrientes se consultan en USDA y USFQ; revisa la cantidad y el precio antes de guardarlo.</p>
        </div>
        <ListaAlimentos idPaciente={idPaciente} paciente={paciente} onContinue={volverDelCatalogo} />
      </div>
    );
  }

  const hayAlimentos = cantidadAlimentos > 0;
  const puedeGenerar = catalogoPreparadoParaMenu(cobertura, cantidadAlimentos);
  const coberturaInsuficiente = faltanAlimentos(cobertura?.suficiencia);
  const etapaActual = menu ? 3 : puedeGenerar ? 2 : 1;
  const menuMostrado = versionVista || menu;
  const diasMenu = menuMostrado?.dias || [];
  const diaActivo = diasMenu.find((dia) => dia.numeroDia === diaSeleccionado) || diasMenu[0];

  return (
    <div className="menu-flow">
      {!menu && <>
        <div className="menu-flow-heading">
          <span className="menu-flow-kicker">PLANIFICACIÓN CLÍNICA</span>
          <h3>Un menú construido en orden</h3>
          <p>Primero los alimentos disponibles; después la propuesta semanal y tu revisión profesional.</p>
        </div>
        <ol className="menu-flow-steps" aria-label="Pasos del menú semanal">
          {["Alimentos", "Generar", "Revisar y aprobar"].map((nombre, indice) => (
            <li key={nombre} className={indice + 1 === etapaActual ? "active" : indice + 1 < etapaActual ? "done" : ""} aria-current={indice + 1 === etapaActual ? "step" : undefined}>
              <span>{indice + 1 < etapaActual ? <Check size={14} strokeWidth={2.8} aria-hidden="true" /> : indice + 1}</span>
              {nombre}
            </li>
          ))}
        </ol>
      </>}
      {error && (
        <p role="alert" className="menu-flow-error">
          {error}
        </p>
      )}

      {!menu && !generando && (
        <div className="menu-flow-preparation">
          <section className="menu-flow-step-card">
            <span className="menu-flow-card-icon"><UtensilsCrossed size={20} aria-hidden="true" /></span>
            <div>
              <span className="menu-flow-kicker">01 · SELECCIÓN</span>
              <h4>{hayAlimentos ? `${cantidadAlimentos} alimento${cantidadAlimentos === 1 ? "" : "s"} guardado${cantidadAlimentos === 1 ? "" : "s"}` : "Elige los alimentos"}</h4>
              <p>{hayAlimentos ? "Puedes revisar cantidades, precios y nutrientes antes de generar." : "Añade alimentos del catálogo; la consulta nutricional completará los datos disponibles."}</p>
            </div>
            <button type="button" onClick={() => setVista("alimentos")}>
              {hayAlimentos ? "Revisar alimentos" : "Elegir alimentos"}<ArrowRight size={15} aria-hidden="true" />
            </button>
          </section>
          {hayAlimentos && coberturaInsuficiente && (
            <details className="menu-flow-coverage">
              <summary><IconAlertTriangle style={{ width: 15, height: 15 }} />La cobertura aún es baja. Ver qué conviene añadir</summary>
              <SuficienciaAlimentos suficiencia={cobertura.suficiencia} titulo="Revisión del inventario semanal" />
            </details>
          )}
          <section className={`menu-flow-step-card menu-flow-generate ${!puedeGenerar ? "locked" : ""}`}>
            <span className="menu-flow-card-icon"><Sparkles size={20} aria-hidden="true" /></span>
            <div>
              <span className="menu-flow-kicker">02 · PROPUESTA</span>
              <h4>Generar menú semanal</h4>
              <p>{puedeGenerar ? "La IA propondrá platos con estos alimentos. Podrás revisar cada comida antes de aprobar." : !cobertura && hayAlimentos ? "No se pudo comprobar el catálogo. Vuelve a abrir los alimentos para reintentar." : "Completa alimentos esenciales, cantidades para siete días y datos nutricionales antes de generar."}</p>
            </div>
            <button type="button" onClick={() => handleGenerar(false)} disabled={!puedeGenerar}>
              Generar menú <ArrowRight size={15} aria-hidden="true" />
            </button>
          </section>
        </div>
      )}

      {generando ? (
        <PanelGenerando paso={paso} segundos={segundos} />
      ) : menu ? (
        <MenuSemanalVista
          menu={menuMostrado}
          esHistorico={Boolean(versionVista)}
          historial={historial}
          mostrarHistorial={mostrarHistorial}
          onToggleHistorial={() => setMostrarHistorial((visible) => !visible)}
          onVerVersion={verVersion}
          onVolverActual={() => verVersion(menu.id)}
          paciente={paciente}
          idPaciente={idPaciente}
          presupuesto={presupuesto}
          cobertura={cobertura}
          puedeGenerar={puedeGenerar}
          diaActivo={diaActivo}
          onSeleccionarDia={setDiaSeleccionado}
          onAprobar={handleAprobar}
          onGenerar={() => setConfirmarNuevaVersion(true)}
          onRevisarAlimentos={() => setVista("alimentos")}
          onSeguimiento={onSeguimiento}
          onAcceso={onAcceso}
          onAjustarComida={setComidaEditar}
          explicandoId={explicandoId}
          preparandoTodo={preparandoTodo}
          onPreparacion={handleExplicarComida}
          onBebida={setComidaBebida}
        />
      ) : null}

      <Modal
        isOpen={confirmarNuevaVersion}
        onClose={() => setConfirmarNuevaVersion(false)}
        title="Nueva propuesta de menú"
      >
        <div className="menu-version-confirm">
          <p>Se creará una nueva propuesta para este paciente. El menú anterior se conservará en el historial.</p>
          <p>Si hay un menú aprobado, el paciente seguirá viendo esa versión hasta que apruebes la nueva. Sus registros asociados al menú anterior también se conservan.</p>
          <div>
            <button type="button" onClick={() => setConfirmarNuevaVersion(false)}>Cancelar</button>
            <button type="button" className="weekly-menu-approve" onClick={() => handleGenerar(true)} disabled={!puedeGenerar || generando}>Crear nueva propuesta</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={comidaBebida !== null} onClose={() => setComidaBebida(null)} title="Bebida de la comida">
        {comidaBebida && <EditorBebida key={comidaBebida.id} idPaciente={idPaciente} comida={comidaBebida} onGuardar={handleGuardarBebida} onCancelar={() => setComidaBebida(null)} />}
      </Modal>

      <Modal
        isOpen={comidaPreparacion !== null}
        onClose={() => setComidaPreparacion(null)}
        title="Explicación de preparación"
      >
        {comidaPreparacion && (
          <EditorPreparacion
            key={`${comidaPreparacion.id}-${JSON.stringify(comidaPreparacion.preparacion)}`}
            comida={comidaPreparacion}
            soloLectura={Boolean(versionVista)}
            onGuardar={handleGuardarPreparacion}
            rehaciendo={explicandoId === comidaPreparacion.id}
            onRehacer={() => handleExplicarComida(comidaPreparacion, true)}
            onCancelar={() => setComidaPreparacion(null)}
          />
        )}
      </Modal>

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

function fechaDelPlan(fechaInicio, numeroDia, opciones) {
  if (!fechaInicio) return null;
  const fecha = new Date(/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) ? `${fechaInicio}T12:00:00Z` : fechaInicio);
  if (Number.isNaN(fecha.getTime())) return null;
  fecha.setUTCDate(fecha.getUTCDate() + numeroDia - 1);
  const texto = new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", ...opciones }).format(fecha);
  return texto.charAt(0).toLocaleUpperCase("es-EC") + texto.slice(1);
}

// Ilustraciones decorativas del selector, siguiendo la secuencia visual del plan semanal.
const ICONOS_DIAS = ["presentacion", "ensalada", "proteinas", "sopa", "carne", "fibra", "merienda"];

function ResumenSeguimientoMenu({ idPaciente }) {
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    let vigente = true;
    listarSeguimiento(idPaciente)
      .then((datos) => { if (vigente) setRegistros(Array.isArray(datos) ? datos : []); })
      .catch(() => { if (vigente) setRegistros([]); });
    return () => { vigente = false; };
  }, [idPaciente]);

  const pesos = registros
    .filter((registro) => Number.isFinite(Number(registro.peso)) && Number(registro.peso) > 0)
    .sort(ordenarControles);
  if (pesos.length === 0) return null;

  const inicial = Number(pesos[0].peso);
  const actual = Number(pesos.at(-1).peso);
  const diferencia = actual - inicial;
  const magnitud = Math.abs(diferencia).toFixed(1).replace(".", ",");
  const porcentaje = Math.abs((diferencia / inicial) * 100).toFixed(1).replace(".", ",");
  const tendencia = diferencia < -0.05 ? "bajo" : diferencia > 0.05 ? "subio" : "estable";
  const diasConPeso = new Set(pesos.map((registro) => new Date(registro.fecha).toISOString().slice(0, 10))).size;

  return <section className="weekly-side-card weekly-progress">
    <div className="weekly-side-heading"><span className="weekly-side-icon"><NutriIcon name="objetivo" size={22} /></span><strong>Progreso del peso</strong></div>
    <div className="weekly-progress-change" data-trend={tendencia}>{pesos.length === 1 ? `${actual.toFixed(1).replace(".", ",")} kg` : tendencia === "estable" ? "Sin cambio" : `${tendencia === "bajo" ? "Bajó" : "Subió"} ${magnitud} kg`}</div>
    <p>Registro inicial: {inicial.toFixed(1).replace(".", ",")} kg · Actual: {actual.toFixed(1).replace(".", ",")} kg</p>
    <small>{diasConPeso === 1 ? "La gráfica muestra el último peso del día; falta otra fecha para ver la tendencia." : `${porcentaje}% respecto al registro inicial`}</small>
    <PesoTrendChart registros={pesos} id={`menu-${idPaciente}`} compacto />
  </section>;
}

function MenuSemanalVista({ menu, esHistorico, historial, mostrarHistorial, onToggleHistorial, onVerVersion, onVolverActual, paciente, idPaciente, presupuesto, cobertura, puedeGenerar, diaActivo, onSeleccionarDia, onAprobar, onGenerar, onRevisarAlimentos, onSeguimiento, onAcceso, onAjustarComida, explicandoId, preparandoTodo, onPreparacion, onBebida }) {
  const dias = [...(menu.dias || [])].sort((a, b) => a.numeroDia - b.numeroDia);
  const indiceActivo = Math.max(0, dias.findIndex((dia) => dia.id === diaActivo?.id));
  const aprobado = menu.estado === "aprobado";
  const versionVisible = historial.find((version) => version.visibleParaPaciente);
  const estaVisible = Number(versionVisible?.id) === Number(menu.id);
  const objetivo = paciente?.objetivo || "Plan personalizado";

  return (
    <div className="weekly-menu">
      <header className="weekly-menu-hero" style={{ backgroundImage: `url(${menuFoodHero})` }}>
        <span className="menu-flow-kicker">PLANIFICACIÓN CLÍNICA</span>
        <div className="weekly-menu-title"><h3>Tu menú semanal</h3><span><Sparkles size={15} aria-hidden="true" /> Generado con IA</span></div>
        <p>Una propuesta para {objetivo.toLowerCase()}, lista para tu revisión profesional.</p>
      </header>

      <div className="weekly-menu-toolbar">
        <div className="weekly-menu-week"><CalendarDays size={17} aria-hidden="true" /> Semana 1</div>
        <div className="weekly-menu-actions">
          <span className={`weekly-menu-status ${aprobado ? "approved" : "pending"}`}><Check size={15} aria-hidden="true" /> {estaVisible ? "Visible para el paciente" : esHistorico ? "Versión anterior · consulta" : "Propuesta pendiente"}</span>
          {esHistorico && <button type="button" className="weekly-menu-history-button" onClick={onVolverActual}>Volver a la versión actual</button>}
          <button type="button" className="weekly-menu-history-button" onClick={onToggleHistorial} aria-expanded={mostrarHistorial}><History size={15} aria-hidden="true" /> Historial ({historial.length})</button>
          {!aprobado && !esHistorico && <button type="button" className="weekly-menu-approve" onClick={onAprobar}><Check size={17} aria-hidden="true" /> Aprobar menú</button>}
          {!esHistorico && <details className="weekly-menu-more">
            <summary aria-label="Más opciones del menú">···</summary>
            <div>
              <button type="button" onClick={onRevisarAlimentos}>Revisar alimentos</button>
              <button type="button" onClick={onGenerar} disabled={!puedeGenerar}>Crear nueva propuesta</button>
            </div>
          </details>}
        </div>
      </div>

      {!esHistorico && !aprobado && versionVisible && <p className="weekly-menu-patient-note">El paciente sigue viendo el menú aprobado anterior. Esta propuesta se mostrará en su app cuando la apruebes.</p>}
      {mostrarHistorial && <section className="weekly-menu-history" aria-label="Historial de menús">
        <div className="weekly-menu-history-heading"><strong>Versiones guardadas</strong><span>Selecciona una para consultar sus comidas.</span></div>
        <div className="weekly-menu-history-list">
          {historial.map((version, indice) => <button key={version.id} type="button" className={Number(version.id) === Number(menu.id) ? "selected" : ""} onClick={() => onVerVersion(version.id)}>
            <strong>Versión {historial.length - indice}</strong>
            <span>{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeZone: "America/Guayaquil" }).format(new Date(version.fechaGeneracion))}</span>
            <em>{version.visibleParaPaciente ? "Visible para el paciente" : version.estado === "aprobado" ? "Aprobada anterior" : "Propuesta sin aprobar"}</em>
          </button>)}
        </div>
      </section>}

      {aprobado && !esHistorico && <div className="menu-flow-next weekly-menu-next">
        <span className="menu-flow-card-icon"><ClipboardCheck size={19} aria-hidden="true" /></span>
        <div><strong>Siguiente: acompañar al paciente</strong><p>Consulta su evolución o prepara su acceso a la app.</p></div>
        <button type="button" onClick={onSeguimiento}>Seguimiento</button>
        <button type="button" onClick={onAcceso}><Smartphone size={15} aria-hidden="true" /> Acceso a la app</button>
      </div>}

      <div className="weekly-menu-layout">
        <aside className="weekly-menu-sidebar" aria-label="Resumen del plan">
          <section className="weekly-side-card weekly-goal">
            <div className="weekly-side-heading"><span className="weekly-side-icon"><NutriIcon name="objetivo" size={22} /></span><strong>Objetivo del plan</strong></div>
            <b>{objetivo}</b>
            {paciente?.preferencias && <p>{paciente.preferencias}</p>}
          </section>
          {menu.resumenNutricionalSemanal && <ResumenNutricional resumen={menu.resumenNutricionalSemanal} />}
          {presupuesto !== undefined && <ResumenPresupuesto dias={dias} presupuesto={presupuesto} />}
          {/* Lo nutricional a la izquierda; el seguimiento va bajo las comidas */}
          <RequerimientoNutricional idPaciente={idPaciente} resumenSemanal={menu.resumenNutricionalSemanal} />
        </aside>

        <section className="weekly-menu-content" aria-label="Días y comidas del menú">
          {dias.length > 0 && <div className="weekly-day-nav" role="group" aria-label="Elegir día">
            <button type="button" onClick={() => onSeleccionarDia(dias[Math.max(0, indiceActivo - 1)].numeroDia)} disabled={indiceActivo === 0} aria-label="Día anterior"><ChevronLeft size={19} /></button>
            <span>{fechaDelPlan(menu.fechaInicio, diaActivo?.numeroDia || 1, { weekday: "long" }) || `Día ${diaActivo?.numeroDia}`}</span>
            <button type="button" onClick={() => onSeleccionarDia(dias[Math.min(dias.length - 1, indiceActivo + 1)].numeroDia)} disabled={indiceActivo === dias.length - 1} aria-label="Día siguiente"><ChevronRight size={19} /></button>
          </div>}
          <div className="weekly-day-strip" role="tablist" aria-label="Días del menú">
            {dias.map((dia) => <button
              type="button"
              role="tab"
              aria-selected={dia.id === diaActivo?.id}
              key={dia.id}
              className={dia.id === diaActivo?.id ? "selected" : ""}
              onClick={() => onSeleccionarDia(dia.numeroDia)}
            >
              <strong>{fechaDelPlan(menu.fechaInicio, dia.numeroDia, { weekday: "short" }) || `Día ${dia.numeroDia}`}</strong>
              <span>{fechaDelPlan(menu.fechaInicio, dia.numeroDia, { day: "numeric", month: "short" }) || `Día ${dia.numeroDia}`}</span>
              <span className="weekly-day-art"><NutriIcon name={ICONOS_DIAS[(dia.numeroDia - 1) % ICONOS_DIAS.length]} size={25} /></span>
              <small>{Math.round(Number(dia.caloriasTotales) || 0)} kcal</small>
            </button>)}
          </div>

          {diaActivo && <article className="weekly-day-detail" role="tabpanel">
            <div className="weekly-day-heading">
              <h4><CalendarDays size={19} aria-hidden="true" /> {fechaDelPlan(menu.fechaInicio, diaActivo.numeroDia, { weekday: "long", day: "numeric", month: "long" }) || `Día ${diaActivo.numeroDia}`}</h4>
              <span className="weekly-day-calories"><NutriIcon name="calorias" size={18} /> {Math.round(Number(diaActivo.caloriasTotales) || 0)} kcal</span>
            </div>
            <NutrientesDelDia dia={diaActivo} metaCalorias={cobertura?.suficiencia?.calorias?.requeridoDia} metaProteinas={cobertura?.suficiencia?.proteinas?.requeridoDia} />
            <div className="weekly-meals">
              {(diaActivo.comidas || []).map((comida) => <div key={comida.id} className="weekly-meal-wrap"><details className="weekly-meal">
                <summary>
                  <span className="weekly-meal-icon"><IconoMomento tipoComida={comida.tipoComida} /></span>
                  <span className="weekly-meal-copy"><strong>{comida.tipoComida}</strong><span><NombreConBebida nombrePlato={comida.nombrePlato} bebida={comida.bebida} /></span></span>
                  {!esHistorico && <button type="button" className={`weekly-meal-drink-icon ${comida.bebida ? "con-bebida" : ""}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBebida(comida); }}
                    title={comida.bebida ? `Bebida: ${comida.bebida} (cambiar)` : "Agregar bebida"} aria-label={comida.bebida ? `Cambiar bebida: ${comida.bebida}` : "Agregar bebida"}>
                    <CupSoda size={15} aria-hidden="true" />
                  </button>}
                  <b className="weekly-meal-calories" title={comida.nutrientes?.completo === false ? "Valor estimado: faltan nutrientes de algún alimento" : undefined}>{comida.nutrientes?.completo === false && <IconAlertTriangle style={{ width: 12, height: 12 }} />} {Math.round(Number(comida.calorias) || 0)} kcal</b>
                  <ChevronRight className="weekly-meal-chevron" size={17} aria-hidden="true" />
                </summary>
                <div className="weekly-meal-details">
                  {comida.descripcion && <p>{comida.descripcion}</p>}
                  <p>{(comida.detalles || []).map((d) => `${d.nombreAlimento} ${cantidadLegible(d.cantidadUtilizada, d.unidadMedida)}`).join(" · ")}</p>
                  <TarjetaBebida bebida={comida.bebida} nutricion={comida.bebidaNutricion} className="my-2" />
                  <div><span>Costo estimado: ${Number(comida.costoTotal || 0).toFixed(2)}</span>{!aprobado && !esHistorico && <button type="button" onClick={() => onAjustarComida(comida)}>Ajustar comida <ArrowRight size={14} aria-hidden="true" /></button>}</div>
                </div>
              </details>
                <div className="weekly-meal-actions">
                {(tienePreparacion(comida) || !esHistorico) && <button type="button" className="weekly-meal-prep" onClick={() => onPreparacion(comida)} disabled={Boolean(explicandoId) || (preparandoTodo && !tienePreparacion(comida))}>
                  {explicandoId === comida.id || (preparandoTodo && !tienePreparacion(comida))
                    ?<><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Escribiendo la preparación…</>
                    : tienePreparacion(comida)
                      ? <><ChefHat size={13} aria-hidden="true" /> Ver preparación · {comida.preparacion.pasos.length} pasos{comida.preparacion.minutosTotales > 0 && ` · ${textoMinutos(comida.preparacion.minutosTotales)}`}{separarPasos(comida).bebida.length > 0 && " · plato y bebida"}</>
                      : <><ChefHat size={13} aria-hidden="true" /> Explicación de preparación</>}
                </button>}
                </div>
              </div>)}
            </div>
          </article>}
          <div className="weekly-follow-row">
            <ResumenSeguimientoMenu idPaciente={idPaciente} />
            <EfectividadMenu idPaciente={idPaciente} idMenu={menu.id} />
          </div>
        </section>
      </div>
    </div>
  );
}

function ResumenPresupuesto({ dias, presupuesto }) {
  const costoTotal = dias.reduce(
    (total, dia) => total + Number(dia.costoTotalDia || 0),
    0,
  );
  // Presupuesto opcional: 0 = sin límite (consulta privada)
  const sinLimite = !(Number(presupuesto) > 0);
  const excedido = !sinLimite && costoTotal > presupuesto;
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
          {sinLimite ? <>{costoTotal.toFixed(2)}$<small className="block text-right font-normal text-gray-500">sin presupuesto definido</small></> : <>{costoTotal.toFixed(2)}$ / {Number(presupuesto).toFixed(2)}$</>}
        </span>
      </div>
      {!sinLimite && <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            excedido ? "bg-nutri-pink" : "bg-nutri-brand"
          }`}
          style={{ width: `${anchoAnimado}%` }}
        />
      </div>}
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
  { campo: "proteinas", label: "Proteínas", unidad: "g", meta: "proteinas", icono: "proteinas" },
  { campo: "carbohidratos", label: "Carbohidratos", unidad: "g", icono: "carbohidratos" },
  { campo: "grasasTotales", label: "Grasas", unidad: "g", icono: "grasas" },
  { campo: "fibra", label: "Fibra", unidad: "g", icono: "fibra" },
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
    <div className="weekly-nutrients">
      <div className="weekly-nutrient-meta">
        <span>Información nutricional del día</span>
        {metaCalorias && <small>{calorias} de {Math.round(metaCalorias)} kcal objetivo · {pctCalorias}%</small>}
      </div>
      <div className="weekly-nutrient-list">
        {MACROS_DIA.map((m) => (
          <div key={m.campo} className="weekly-nutrient-item">
            <NutriIcon name={m.icono} size={18} />
            <span>{m.label}</span>
            <strong>{formatoNutriente(n[m.campo], m.unidad)}</strong>
            {m.meta && metas[m.meta] && n[m.campo] !== undefined && <small>de {Math.round(metas[m.meta])} g</small>}
          </div>
        ))}
      </div>
      {micros.length > 0 && (
        <div className="weekly-micros">
          <button
            type="button"
            onClick={() => setVerMas((v) => !v)}
            aria-expanded={verMas}
          >
            {verMas ? "Ocultar minerales y vitaminas" : "Ver minerales y vitaminas"}
          </button>
          {verMas && (
            <dl className="weekly-micros-list">
              {micros.map((m) => (
                <div key={m.campo}>
                  <dt>{m.label}</dt>
                  <dd>{formatoNutriente(n[m.campo], m.unidad)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
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
    { label: "Grasas", valor: n.grasasTotales, unidad: "g" },
    { label: "Fibra", valor: n.fibra, unidad: "g" },
  ];
  const extras = [
    { label: "Grasas saturadas", valor: n.grasasSaturadas, unidad: "g" },
    { label: "Azúcares", valor: n.azucares, unidad: "g" },
    { label: "Sodio", valor: n.sodio, unidad: "mg" },
    { label: "Potasio", valor: n.potasio, unidad: "mg" },
    { label: "Calcio", valor: n.calcio, unidad: "mg" },
    { label: "Hierro", valor: n.hierro, unidad: "mg" },
    { label: "Magnesio", valor: n.magnesio, unidad: "mg" },
  ];

  if (items.every((i) => i.valor === undefined)) return null;

  return (
    <section className="weekly-side-card weekly-average">
      <div className="weekly-side-heading"><span className="weekly-side-icon"><NutriIcon name="calorias" size={22} /></span><strong>Promedio diario</strong></div>
      {!resumen.completo && <p className="weekly-average-warning">Estimado: faltan valores de algunos alimentos.</p>}
      <dl>
        {items.map((i) => (
          <div key={i.label}>
            <dt>{i.label}</dt>
            <dd>{i.valor !== undefined ? formatoNutriente(Number(i.valor) / 7, i.unidad) : "—"}</dd>
          </div>
        ))}
      </dl>
      {extras.some((i) => i.valor !== undefined) && <details className="weekly-average-extra">
        <summary>Más nutrientes</summary>
        <dl>{extras.filter((i) => i.valor !== undefined).map((i) => <div key={i.label}><dt>{i.label}</dt><dd>{formatoNutriente(Number(i.valor) / 7, i.unidad)}</dd></div>)}</dl>
      </details>}
    </section>
  );
}

export default MenuPaciente;

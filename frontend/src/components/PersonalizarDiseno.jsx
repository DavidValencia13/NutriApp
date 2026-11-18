import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CalendarDays, Check, ImagePlus, Loader2, MessageSquareQuote, Paintbrush, Sun, Trash2, TrendingUp } from "lucide-react";
import { obtenerMarcaNutriologo, guardarMarcaNutriologo } from "../services/authService";
import { ESTILOS_ENCABEZADO, PALETA_MARCA, achicarLogo, colorDeMarca, esColorPropio, fondoEncabezado } from "../utils/marca";
import { Logo } from "./Logo";

// "Personalizar diseño": el nutricionista define cómo ve su paciente la app
// (identidad, color, estilo y mensaje), con vista previa de celular en vivo.
const VACIA = { nombreConsulta: "", especialidad: "", mensajeBienvenida: "", color: "verde", estiloEncabezado: "degradado", logo: null };

function desdeServidor(m) {
  return {
    nombreConsulta: m?.nombreConsulta || "",
    especialidad: m?.especialidad || "",
    mensajeBienvenida: m?.mensajeBienvenida || "",
    color: m?.color || "verde",
    estiloEncabezado: m?.estiloEncabezado || "degradado",
    logo: m?.logo || null,
  };
}

function Seccion({ numero, titulo, descripcion, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 shrink-0 rounded-full bg-nutri-ink text-white text-xs font-bold flex items-center justify-center">{numero}</span>
        <div>
          <h3 className="font-semibold text-nutri-ink leading-tight">{titulo}</h3>
          {descripcion && <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Campo({ etiqueta, valor, max, placeholder, onChange, multilinea = false }) {
  const Entrada = multilinea ? "textarea" : "input";
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-medium text-nutri-ink">
        {etiqueta}
        <span className="text-xs font-normal text-gray-400 tabular">{valor.length}/{max}</span>
      </span>
      <Entrada value={valor} maxLength={max} placeholder={placeholder} rows={multilinea ? 2 : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nutri-brand/30 resize-none" />
    </label>
  );
}

// Vista previa: la app del paciente en un celular
function VistaCelular({ marca, nombreNutricionista }) {
  const c = colorDeMarca(marca) || PALETA_MARCA.verde;
  const nombre = marca.nombreConsulta.trim();
  const tieneMarca = nombre || marca.logo;
  return (
    <div className="mx-auto w-[270px] rounded-[2.2rem] bg-gray-900 p-2.5 shadow-2xl">
      <div className="relative rounded-[1.7rem] overflow-hidden bg-surface h-[520px] flex flex-col">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-gray-900 z-10" aria-hidden="true" />
        <div className="flex items-center gap-2 px-4 pt-7 pb-2.5 text-white" style={{ background: c.oscuro }}>
          {tieneMarca ? (
            <>
              {marca.logo && <img src={marca.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />}
              <span className="min-w-0 leading-tight">
                <span className="block text-sm font-semibold truncate">{nombre || "Mi nutricionista"}</span>
                <span className="block text-[10px] text-white/60 truncate">{marca.especialidad.trim() || "con NutriApp"}</span>
              </span>
            </>
          ) : <Logo size={22} light />}
        </div>
        <div className="px-4 pt-4 pb-5 text-white" style={{ background: fondoEncabezado(c, marca.estiloEncabezado) }}>
          <p className="text-xl font-semibold">Hola, María</p>
          <p className="text-[11px] text-white/75 mt-0.5">Plan preparado por {nombreNutricionista || "tu nutricionista"}.</p>
          {marca.mensajeBienvenida.trim() && (
            <p className="mt-2.5 text-[11px] leading-snug rounded-lg bg-white/15 px-2.5 py-2 italic">“{marca.mensajeBienvenida.trim()}”</p>
          )}
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          <div className="rounded-xl bg-white border border-line p-3 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ color: c.principal, background: `${c.claro}55` }}>50%</span>
            <span className="text-xs font-semibold text-nutri-ink">2 de 4 comidas registradas</span>
          </div>
          {["Desayuno", "Almuerzo"].map((t) => (
            <div key={t} className="rounded-xl bg-white border border-line p-3">
              <p className="text-[11px] font-semibold" style={{ color: c.principal }}>{t}</p>
              <p className="text-xs font-semibold text-nutri-ink">Plato del día</p>
              <div className="grid grid-cols-3 gap-1 mt-2">
                <span className="text-[10px] text-center rounded-md py-1 text-white" style={{ background: c.principal }}>La comí</span>
                <span className="text-[10px] text-center rounded-md py-1 border border-line text-gray-500">Una parte</span>
                <span className="text-[10px] text-center rounded-md py-1 border border-line text-gray-500">No</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 border-t border-line bg-white py-2">
          {[[Sun, "Hoy"], [CalendarDays, "Semana"], [TrendingUp, "Progreso"]].map(([Icono, t], i) => (
            <span key={t} className="flex flex-col items-center gap-0.5 text-[10px]" style={{ color: i === 0 ? c.principal : "#9ca3af" }}>
              <Icono size={15} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonalizarDiseno({ nombreNutricionista, onCerrar }) {
  const [marca, setMarca] = useState(VACIA);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const entradaLogo = useRef(null);
  const cambiar = (campo) => (valor) => { setGuardado(false); setMarca((m) => ({ ...m, [campo]: valor })); };

  useEffect(() => {
    let vigente = true;
    obtenerMarcaNutriologo()
      .then((m) => { if (vigente) setMarca(desdeServidor(m)); })
      .catch((err) => { if (vigente) setError(err.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  async function elegirLogo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError("");
    try {
      cambiar("logo")(await achicarLogo(archivo));
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardar(datos) {
    setError("");
    setGuardando(true);
    try {
      setMarca(desdeServidor(await guardarMarcaNutriologo(datos)));
      setGuardado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div className="esqueleto h-96 rounded-xl" />;

  const c = colorDeMarca(marca) || PALETA_MARCA.verde;
  const propio = esColorPropio(marca.color);

  return (
    <div className="-m-6 flex flex-col">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-6 py-5">
        <div className="space-y-4 min-w-0">
          <p className="text-sm text-gray-600">Dale a la app de tus pacientes la imagen de tu consulta. Los cambios se ven a la derecha antes de guardar.</p>

          <Seccion numero={1} titulo="Identidad" descripcion="Cómo te presentas ante tus pacientes.">
            <div className="flex items-center gap-4">
              <span className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-line bg-surface flex items-center justify-center overflow-hidden">
                {marca.logo ? <img src={marca.logo} alt="Tu logo" className="w-full h-full object-contain p-1.5 bg-white" /> : <ImagePlus size={24} className="text-gray-300" aria-hidden="true" />}
              </span>
              <div className="space-y-1.5">
                <input ref={entradaLogo} type="file" accept="image/png,image/jpeg,image/webp" onChange={elegirLogo} className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => entradaLogo.current?.click()} className="px-3 py-2 rounded-lg border border-line text-sm font-semibold text-nutri-ink hover:bg-gray-50">
                    {marca.logo ? "Cambiar logo" : "Subir logo"}
                  </button>
                  {marca.logo && (
                    <button type="button" onClick={() => cambiar("logo")(null)} className="p-2 rounded-lg text-gray-400 hover:text-nutri-pink" aria-label="Quitar logo"><Trash2 size={16} /></button>
                  )}
                </div>
                <p className="text-xs text-gray-500">PNG, JPG o WebP. Se achica solo para que cargue rápido.</p>
              </div>
            </div>
            <Campo etiqueta="Nombre de tu consulta" valor={marca.nombreConsulta} max={60} placeholder="Ej.: Consultorio Nutrición y Vida" onChange={cambiar("nombreConsulta")} />
            <Campo etiqueta="Especialidad o registro profesional" valor={marca.especialidad} max={80} placeholder="Ej.: Nutrición clínica · Reg. MSP 1234" onChange={cambiar("especialidad")} />
          </Seccion>

          <Seccion numero={2} titulo="Colores y estilo" descripcion="El color se usa en el menú, el encabezado y los botones.">
            <div className="flex flex-wrap items-center gap-2.5">
              {Object.entries(PALETA_MARCA).map(([clave, color]) => {
                const elegido = marca.color === clave;
                return (
                  <button key={clave} type="button" onClick={() => cambiar("color")(clave)} aria-pressed={elegido} title={color.nombre} aria-label={color.nombre}
                    className={`relative w-10 h-10 rounded-full transition-transform ${elegido ? "scale-110" : "hover:scale-105"}`}
                    style={{ background: `linear-gradient(135deg, ${color.principal}, ${color.oscuro})`, boxShadow: elegido ? `0 0 0 3px #fff, 0 0 0 5px ${color.principal}` : "none" }}>
                    {elegido && <Check size={17} strokeWidth={3} className="absolute inset-0 m-auto text-white" aria-hidden="true" />}
                  </button>
                );
              })}
              <label title="Elegir un color propio"
                className={`relative w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-transform ${propio ? "scale-110" : "hover:scale-105"}`}
                style={{ background: propio ? marca.color : "conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)", boxShadow: propio ? `0 0 0 3px #fff, 0 0 0 5px ${marca.color}` : "none" }}>
                {propio ? <Check size={17} strokeWidth={3} className="text-white" aria-hidden="true" /> : <Paintbrush size={16} className="text-white drop-shadow" aria-hidden="true" />}
                <input type="color" value={propio ? marca.color : "#1d5fa8"} onChange={(e) => cambiar("color")(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Color propio" />
              </label>
              <span className="text-sm text-gray-500 ml-1">{c.nombre}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-nutri-ink mb-2">Estilo del encabezado</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ESTILOS_ENCABEZADO).map(([clave, nombre]) => {
                  const elegido = marca.estiloEncabezado === clave;
                  return (
                    <button key={clave} type="button" onClick={() => cambiar("estiloEncabezado")(clave)} aria-pressed={elegido}
                      className={`rounded-xl border-2 p-1.5 text-xs font-semibold transition-colors ${elegido ? "border-nutri-ink text-nutri-ink" : "border-line text-gray-500 hover:border-gray-300"}`}>
                      <span className="block h-10 rounded-lg mb-1.5" style={{ background: fondoEncabezado(c, clave) }} />
                      {nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          </Seccion>

          <Seccion numero={3} titulo="Mensaje para tus pacientes" descripcion="Aparece en el encabezado de su app. Opcional.">
            <Campo etiqueta="Mensaje de bienvenida" valor={marca.mensajeBienvenida} max={160} multilinea
              placeholder="Ej.: ¡Vamos paso a paso! Cualquier duda, escríbeme en tu próxima consulta." onChange={cambiar("mensajeBienvenida")} />
          </Seccion>
        </div>

        <aside className="lg:sticky lg:top-0 self-start">
          <p className="text-xs font-semibold text-gray-500 text-center mb-3 flex items-center justify-center gap-1.5"><MessageSquareQuote size={14} aria-hidden="true" /> Vista previa de la app del paciente</p>
          <VistaCelular marca={marca} nombreNutricionista={nombreNutricionista} />
        </aside>
      </div>

      <div className="sticky -bottom-6 z-10 flex flex-wrap items-center justify-end gap-2 px-6 py-3 border-t border-line bg-white/95 backdrop-blur">
        <button type="button" disabled={guardando} onClick={() => guardar({})} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-ink">
          Volver al diseño de NutriApp
        </button>
        {error && <p className="w-full sm:w-auto text-sm text-nutri-pink order-first sm:order-none">{error}</p>}
        {guardado && <span className="text-sm text-nutri-green flex items-center gap-1.5"><BadgeCheck size={16} aria-hidden="true" /> Guardado: tus pacientes ya lo ven</span>}
        <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-lg border border-line text-sm">{guardado ? "Cerrar" : "Cancelar"}</button>
        <button type="button" disabled={guardando}
          onClick={() => guardar({ ...marca, nombreConsulta: marca.nombreConsulta.trim(), especialidad: marca.especialidad.trim(), mensajeBienvenida: marca.mensajeBienvenida.trim() })}
          className="px-5 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-80 shadow-sm" style={{ background: c.principal }}>
          {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Guardar diseño
        </button>
      </div>
    </div>
  );
}

export default PersonalizarDiseno;

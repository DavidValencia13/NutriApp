import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { obtenerMarcaNutriologo, guardarMarcaNutriologo } from "../services/authService";
import { PALETA_MARCA, achicarLogo } from "../utils/marca";
import { Logo } from "./Logo";

// "Personalizar diseño": el nutricionista elige el nombre de su consulta, un
// color y su logo; su paciente los ve en la app. Con vista previa en vivo.
function PersonalizarDiseno({ nombreNutricionista, onCerrar }) {
  const [marca, setMarca] = useState({ nombreConsulta: "", color: "verde", logo: null });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const entradaLogo = useRef(null);

  useEffect(() => {
    let vigente = true;
    obtenerMarcaNutriologo()
      .then((m) => {
        if (vigente) setMarca({ nombreConsulta: m?.nombreConsulta || "", color: m?.color || "verde", logo: m?.logo || null });
      })
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
      const logo = await achicarLogo(archivo);
      setMarca((m) => ({ ...m, logo }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardar(datos) {
    setError("");
    setGuardando(true);
    try {
      const guardada = await guardarMarcaNutriologo(datos);
      setMarca({ nombreConsulta: guardada?.nombreConsulta || "", color: guardada?.color || "verde", logo: guardada?.logo || null });
      setGuardado(true);
      setTimeout(() => onCerrar?.(), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div className="esqueleto h-72 rounded-xl" />;

  const c = PALETA_MARCA[marca.color] || PALETA_MARCA.verde;
  const nombreVisible = marca.nombreConsulta.trim();

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Así verán tus pacientes su app. Elige el nombre de tu consulta, tu color y tu logo. Puedes cambiarlo cuando quieras.
      </p>

      {/* Vista previa de la app del paciente */}
      <div className="rounded-2xl overflow-hidden border border-line shadow-sm" aria-label="Vista previa de la app del paciente">
        <div className="flex">
          <div className="hidden sm:flex w-36 shrink-0 flex-col gap-2 p-3" style={{ background: c.oscuro }}>
            <div className="flex items-center gap-2 min-w-0">
              {marca.logo
                ? <img src={marca.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
                : <Logo size={22} light />}
              {nombreVisible && <span className="text-white text-xs font-semibold truncate">{nombreVisible}</span>}
            </div>
            {["Hoy", "Mi semana", "Mi progreso"].map((t, i) => (
              <span key={t} className="text-[11px] text-white/80 rounded-md px-2 py-1" style={i === 0 ? { background: `${c.principal}cc`, color: "#fff" } : undefined}>{t}</span>
            ))}
          </div>
          <div className="flex-1 min-w-0 bg-surface">
            <div className="px-4 py-4 text-white" style={{ background: `linear-gradient(110deg, ${c.oscuro}, ${c.principal})` }}>
              <p className="text-lg font-semibold">Hola, María</p>
              <p className="text-xs text-white/80">Plan preparado por {nombreVisible || `tu nutricionista ${nombreNutricionista || ""}`.trim()}.</p>
            </div>
            <div className="p-3">
              <div className="rounded-lg bg-white border border-line p-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: c.principal }}>Desayuno</span>
                <span className="text-[11px] rounded-md px-2 py-1 text-white" style={{ background: c.principal }}>La comí</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-nutri-ink">Nombre de tu consulta</span>
        <input type="text" value={marca.nombreConsulta} maxLength={60} placeholder="Ej.: Consultorio Nutrición Vida"
          onChange={(e) => setMarca((m) => ({ ...m, nombreConsulta: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-nutri-ink mb-2">Color</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PALETA_MARCA).map(([clave, color]) => {
            const elegido = marca.color === clave;
            return (
              <button key={clave} type="button" onClick={() => setMarca((m) => ({ ...m, color: clave }))} aria-pressed={elegido}
                title={color.nombre} aria-label={color.nombre}
                className={`relative w-11 h-11 rounded-full transition-transform ${elegido ? "scale-110" : "hover:scale-105"}`}
                style={{ background: `linear-gradient(135deg, ${color.principal}, ${color.oscuro})`, boxShadow: elegido ? `0 0 0 3px #fff, 0 0 0 5px ${color.principal}` : "none" }}>
                {elegido && <Check size={18} strokeWidth={3} className="absolute inset-0 m-auto text-white" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{c.nombre}</p>
      </fieldset>

      <div>
        <span className="text-sm font-semibold text-nutri-ink">Logo</span>
        <div className="mt-2 flex items-center gap-3">
          <span className="w-16 h-16 rounded-xl border border-line bg-white flex items-center justify-center overflow-hidden">
            {marca.logo ? <img src={marca.logo} alt="Tu logo" className="w-full h-full object-contain p-1" /> : <ImagePlus size={22} className="text-gray-300" aria-hidden="true" />}
          </span>
          <input ref={entradaLogo} type="file" accept="image/png,image/jpeg,image/webp" onChange={elegirLogo} className="hidden" />
          <button type="button" onClick={() => entradaLogo.current?.click()} className="px-3 py-2 rounded-lg border border-line text-sm font-semibold text-nutri-ink hover:bg-gray-50">
            {marca.logo ? "Cambiar logo" : "Subir logo"}
          </button>
          {marca.logo && (
            <button type="button" onClick={() => setMarca((m) => ({ ...m, logo: null }))} className="p-2 rounded-lg text-gray-400 hover:text-nutri-pink" aria-label="Quitar logo">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">PNG, JPG o WebP. Se achica solo para que cargue rápido.</p>
      </div>

      {error && <p className="text-sm text-nutri-pink">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line">
        <button type="button" disabled={guardando} onClick={() => guardar({})} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-ink">
          Volver al diseño de NutriApp
        </button>
        <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-lg border border-line text-sm">Cancelar</button>
        <button type="button" disabled={guardando || guardado} onClick={() => guardar({ ...marca, nombreConsulta: marca.nombreConsulta.trim() })}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-80" style={{ background: c.principal }}>
          {guardando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : guardado ? <Check size={15} aria-hidden="true" /> : null}
          {guardado ? "¡Guardado!" : "Guardar diseño"}
        </button>
      </div>
    </div>
  );
}

export default PersonalizarDiseno;

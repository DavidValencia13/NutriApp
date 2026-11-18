import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChartPie, ChefHat, Flame, LogOut, MessageCircle, Scale, ShoppingCart, Sun, TrendingUp, UtensilsCrossed, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import IconoMomento from "../components/IconoMomento";
import DiarioAlimentario from "../components/DiarioAlimentario";
import AsistenteChat from "../components/AsistenteChat";
import { cantidadLegible } from "../utils/cantidad";
import { HojaPreparacion, MiniPasos } from "../components/PreparacionPlato";
import PanelComposicion from "../components/ComposicionCorporal";
import { LineaBebida } from "../components/BebidaComida";
import { tienePreparacion, textoMinutos } from "../utils/preparacion";
import { clasesDeMarca, estiloDeMarca } from "../utils/marca";
import BotonTema from "../components/BotonTema";
import { ordenarControles } from "../utils/ordenarControles";
import {
  obtenerPerfilPortal,
  obtenerMenuPortal,
  obtenerComprasPortal,
  obtenerProgresoPortal,
  marcarComida,
  registrarPesoPortal,
} from "../services/portalService";

// App del paciente: ve el menú que su nutricionista aprobó, marca lo que
// comió y registra su peso. Pensada primero para el celular.

const SECCIONES = [
  { id: "hoy", label: "Hoy", Icono: Sun },
  { id: "semana", label: "Mi semana", Icono: CalendarDays },
  { id: "progreso", label: "Mi progreso", Icono: TrendingUp },
  { id: "diario", label: "Mi diario", Icono: UtensilsCrossed },
  { id: "compras", label: "Compras", Icono: ShoppingCart },
  { id: "asistente", label: "Asistente", Icono: MessageCircle },
];

const OPCIONES_MARCA = [
  { estado: "si", label: "La comí", Icono: Check, activo: "bg-nutri-green text-white border-nutri-green" },
  { estado: "parte", label: "Una parte", Icono: ChartPie, activo: "bg-nutri-orange text-white border-nutri-orange" },
  { estado: "no", label: "No la comí", Icono: X, activo: "bg-nutri-pink text-white border-nutri-pink" },
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// "2026-11-10" como fecha local (sin que la zona horaria la mueva un día)
function fechaLocal(texto) {
  const [a, m, d] = String(texto).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}

function fechaDelDia(menu, numeroDia) {
  const f = fechaLocal(menu.fechaInicio);
  f.setDate(f.getDate() + numeroDia - 1);
  return f;
}

// Qué día del menú toca hoy (si ya pasó la semana, el menú se repite)
function numeroDiaDeHoy(menu) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.floor((hoy - fechaLocal(menu.fechaInicio)) / 86400000);
  const total = menu.dias?.length || 7;
  if (dias < 0) return 1;
  return (dias % total) + 1;
}

function textoIngrediente(d) {
  const cantidad = cantidadLegible(d.cantidadUtilizada, d.unidadMedida);
  return d.unidadMedida === "unidad" ? `${cantidad} × ${d.nombreAlimento}` : `${d.nombreAlimento} · ${cantidad}`;
}

function primerNombre(nombre = "") {
  return nombre.trim().split(/\s+/)[0] || "";
}

/* ── Página ─────────────────────────────────────────────────────────────── */
// Logo y nombre de la consulta del nutricionista ("Personalizar diseño");
// sin marca propia se muestra el logo de NutriApp
function EncabezadoMarca({ marca, grande = false }) {
  const nombreConsulta = marca?.nombreConsulta || "";
  if (!marca?.logo && !nombreConsulta) return <Logo size={grande ? 30 : 26} light />;
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      {marca.logo && <img src={marca.logo} alt="" className={`${grande ? "w-10 h-10" : "w-8 h-8"} rounded-lg object-contain bg-white p-0.5 shrink-0`} />}
      <span className="min-w-0 leading-tight">
        <span className="block font-semibold truncate">{nombreConsulta || "Mi nutricionista"}</span>
        <span className="block text-[11px] text-white/60 truncate">{marca.especialidad || "con NutriApp"}</span>
      </span>
    </span>
  );
}

function PortalPaciente() {
  const { paciente, logout } = useAuth();
  const [seccion, setSeccion] = useState("hoy");
  const [perfil, setPerfil] = useState(null);
  const [menu, setMenu] = useState(null);
  const [marcas, setMarcas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerPerfilPortal(), obtenerMenuPortal()])
      .then(([p, m]) => {
        if (!vigente) return;
        setPerfil(p);
        setMenu(m.menu);
        setMarcas(Object.fromEntries((m.marcas || []).map((x) => [x.idComidaMenu, x])));
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  // Marca optimista: se ve al instante y se revierte si el servidor falla
  async function handleMarcar(idComidaMenu, estado, nota) {
    const anterior = marcas[idComidaMenu];
    setMarcas((m) => {
      const copia = { ...m };
      if (estado) copia[idComidaMenu] = { idComidaMenu, estado, nota: nota ?? anterior?.nota ?? null };
      else delete copia[idComidaMenu];
      return copia;
    });
    try {
      await marcarComida(idComidaMenu, estado, nota ?? anterior?.nota ?? null);
    } catch (e) {
      setMarcas((m) => ({ ...m, [idComidaMenu]: anterior }));
      setError(e.message);
    }
  }

  const nombre = primerNombre(perfil?.nombre || paciente?.nombre);

  // Diseño elegido por su nutricionista ("Personalizar diseño")
  const marca = perfil?.marca || null;
  const estiloMarca = estiloDeMarca(marca);
  const nombreConsulta = marca?.nombreConsulta || "";
  return (
    <div className={`portal-root min-h-screen bg-surface md:flex ${clasesDeMarca(marca, "portal")}`} style={estiloMarca}>
      {/* Barra lateral (computadora) */}
      <aside className="portal-rail hidden md:flex w-60 shrink-0 flex-col bg-nutri-ink text-white sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-white/10">
          <EncabezadoMarca marca={marca} grande />
        </div>
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {SECCIONES.map(({ id, label, Icono }) => (
            <button
              key={id}
              onClick={() => setSeccion(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                seccion === id ? "bg-white/10 text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icono size={18} className={seccion === id ? "text-nutri-mint" : ""} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full bg-nutri-mint text-nutri-ink text-xs font-bold w-9 h-9 shrink-0">
            {(nombre[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold truncate">{perfil?.nombre || paciente?.nombre}</p>
            <p className="text-xs text-white/50">Paciente</p>
          </div>
          <BotonTema className="flex items-center justify-center w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer" />
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex items-center justify-center w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Barra superior (celular) */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 bg-nutri-ink text-white">
          <EncabezadoMarca marca={marca} />
          <span className="flex items-center">
            <BotonTema className="p-2 text-white/70 hover:text-white" />
            <button onClick={logout} aria-label="Cerrar sesión" className="p-2 -mr-2 text-white/70 hover:text-white">
              <LogOut size={18} />
            </button>
          </span>
        </div>

        {/* Saludo */}
        <header className="portal-header bg-nutri-ink text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-6 md:pt-12 pb-8">
            <h1 className="text-3xl md:text-4xl font-semibold" style={{ letterSpacing: "-0.02em" }}>
              Hola{nombre ? `, ${nombre}` : ""}
            </h1>
            <p className="mt-2 text-white/70">
              {perfil?.nutriologo
                ? `Plan preparado por tu nutricionista ${perfil.nutriologo}${nombreConsulta ? ` · ${nombreConsulta}` : ""}.`
                : "Tu plan de alimentación."}
              {perfil?.metaCalorias ? ` Meta diaria: ${perfil.metaCalorias} kcal.` : ""}
            </p>
            {marca?.mensajeBienvenida && (
              <p className="mt-4 max-w-xl rounded-xl bg-white/15 px-4 py-3 text-sm italic text-white/95 leading-relaxed">“{marca.mensajeBienvenida}”</p>
            )}
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
          {error && (
            <p className="mb-4 text-sm px-4 py-3 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">{error}</p>
          )}

          {cargando ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="esqueleto h-36 rounded-xl" />
              ))}
            </div>
          ) : seccion === "diario" ? (
            <DiarioAlimentario />
          ) : seccion === "progreso" ? (
            <SeccionProgreso perfil={perfil} />
          ) : seccion === "asistente" ? (
            <section className="bg-white rounded-xl border border-line p-4 sm:p-6">
              <h2 className="font-semibold text-lg mb-1">NutriAsistente</h2>
              <p className="text-sm text-gray-500 mb-4">Pregunta por tu menú aprobado, tu diario o tu progreso. Tu nutricionista toma las decisiones clínicas.</p>
              <AsistenteChat paciente={perfil} modoPaciente />
            </section>
          ) : !menu ? (
            <SinMenu />
          ) : seccion === "hoy" ? (
            <SeccionHoy menu={menu} marcas={marcas} onMarcar={handleMarcar} />
          ) : seccion === "semana" ? (
            <SeccionSemana menu={menu} marcas={marcas} onMarcar={handleMarcar} />
          ) : (
            <SeccionCompras menu={menu} />
          )}
        </main>
      </div>

      {/* Navegación inferior (celular) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line grid grid-cols-6 z-20">
        {SECCIONES.map(({ id, label, Icono }) => (
          <button
            key={id}
            onClick={() => setSeccion(id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              seccion === id ? "text-nutri-brand" : "text-gray-500"
            }`}
          >
            <Icono size={20} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function SinMenu() {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 bg-white rounded-xl border border-line">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface text-nutri-brand mb-4">
        <ChefHat size={26} />
      </div>
      <h2 className="font-semibold text-lg">Tu menú está en preparación</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        Cuando tu nutricionista revise y apruebe tu menú semanal, aparecerá aquí.
      </p>
    </div>
  );
}

/* ── Hoy ────────────────────────────────────────────────────────────────── */
function SeccionHoy({ menu, marcas, onMarcar }) {
  const numero = numeroDiaDeHoy(menu);
  const dia = menu.dias.find((d) => d.numeroDia === numero) || menu.dias[0];
  const fecha = fechaDelDia(menu, dia.numeroDia);
  const marcadas = dia.comidas.filter((c) => marcas[c.id]).length;
  const pct = dia.comidas.length ? Math.round((marcadas / dia.comidas.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-line p-5 flex items-center gap-5">
        <Anillo porcentaje={pct} />
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            {fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })} · Día {dia.numeroDia} de tu menú
          </p>
          <p className="font-semibold text-lg mt-0.5">
            {marcadas} de {dia.comidas.length} comidas registradas
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Flame size={14} className="text-nutri-orange" aria-hidden="true" />
            {Math.round(Number(dia.caloriasTotales) || 0)} kcal planificadas hoy
          </p>
        </div>
      </div>
      <ListaComidas comidas={dia.comidas} marcas={marcas} onMarcar={onMarcar} />
    </div>
  );
}

function Anillo({ porcentaje }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-gray-100)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--color-nutri-brand)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - porcentaje / 100)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular">{porcentaje}%</span>
    </div>
  );
}

/* ── Semana ─────────────────────────────────────────────────────────────── */
function SeccionSemana({ menu, marcas, onMarcar }) {
  const [numero, setNumero] = useState(() => numeroDiaDeHoy(menu));
  const dia = menu.dias.find((d) => d.numeroDia === numero) || menu.dias[0];
  const hoy = numeroDiaDeHoy(menu);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {menu.dias.map((d) => {
          const f = fechaDelDia(menu, d.numeroDia);
          const activo = d.numeroDia === numero;
          const completos = d.comidas.every((c) => marcas[c.id]);
          return (
            <button
              key={d.id}
              onClick={() => setNumero(d.numeroDia)}
              className={`relative flex flex-col items-center min-w-[54px] py-2 rounded-xl border text-sm transition-colors cursor-pointer ${
                activo ? "bg-nutri-ink text-white border-nutri-ink" : "bg-white border-line text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className={`text-[11px] ${activo ? "text-white/70" : "text-gray-400"}`}>{DIAS_SEMANA[f.getDay()]}</span>
              <span className="font-semibold tabular">{f.getDate()}</span>
              {d.numeroDia === hoy && <span className={`text-[10px] font-semibold ${activo ? "text-nutri-mint" : "text-nutri-brand"}`}>Hoy</span>}
              {completos && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nutri-green text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500">
        Día {dia.numeroDia} · {Math.round(Number(dia.caloriasTotales) || 0)} kcal
      </p>
      <ListaComidas comidas={dia.comidas} marcas={marcas} onMarcar={onMarcar} />
    </div>
  );
}

/* ── Comidas ────────────────────────────────────────────────────────────── */
function ListaComidas({ comidas, marcas, onMarcar }) {
  return (
    <div className="space-y-3">
      {comidas.map((c, i) => (
        <TarjetaComida key={c.id} comida={c} marca={marcas[c.id]} onMarcar={onMarcar} indice={i} />
      ))}
    </div>
  );
}

function TarjetaComida({ comida, marca, onMarcar, indice }) {
  const [nota, setNota] = useState(marca?.nota || "");
  const [notaGuardada, setNotaGuardada] = useState(false);
  const [verPreparacion, setVerPreparacion] = useState(false);
  const pideNota = marca && marca.estado !== "si";

  function elegir(estado) {
    // Tocar la opción ya elegida la quita
    onMarcar(comida.id, marca?.estado === estado ? null : estado, estado === "si" ? null : nota || null);
    setNotaGuardada(false);
  }

  return (
    <article
      className="bg-white rounded-xl border border-line overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${indice * 50}ms` }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <IconoMomento tipoComida={comida.tipoComida} tamano="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-nutri-brand">{comida.tipoComida}</p>
              <span className="text-xs text-gray-500 tabular shrink-0">{Math.round(Number(comida.calorias) || 0)} kcal</span>
            </div>
            <h3 className="font-semibold leading-snug mt-0.5">{comida.nombrePlato}</h3>
            {comida.descripcion && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{comida.descripcion}</p>}
          </div>
        </div>

        {comida.detalles?.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {comida.detalles.map((d) => (
              <li key={d.id} className="text-xs bg-surface text-gray-700 rounded-full px-2.5 py-1">
                {textoIngrediente(d)}
              </li>
            ))}
          </ul>
        )}

        <LineaBebida bebida={comida.bebida} nutricion={comida.bebidaNutricion} className="mt-3 text-gray-700" />

        {tienePreparacion(comida) && (
          <button type="button" onClick={() => setVerPreparacion(true)}
            className="boton-preparacion mt-3 w-full flex flex-col items-center gap-1.5 rounded-xl text-white py-3">
            <span className="flex items-center gap-2 font-bold text-[15px]">
              <ChefHat size={19} aria-hidden="true" /> Ver cómo prepararlo
              {comida.preparacion.minutosTotales > 0 && <span className="font-normal opacity-90">· {textoMinutos(comida.preparacion.minutosTotales)}</span>}
            </span>
            <MiniPasos pasos={comida.preparacion.pasos} />
          </button>
        )}
      </div>
      {verPreparacion && <HojaPreparacion comida={comida} onCerrar={() => setVerPreparacion(false)} />}

      <div className="border-t border-line bg-gray-50/60 px-4 sm:px-5 py-3">
        <p className="text-xs text-gray-500 mb-2">¿Cómo te fue con esta comida?</p>
        <div className="grid grid-cols-3 gap-2">
          {OPCIONES_MARCA.map(({ estado, label, Icono, activo }) => {
            const elegido = marca?.estado === estado;
            return (
              <button
                key={estado}
                onClick={() => elegir(estado)}
                aria-pressed={elegido}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  elegido ? activo : "bg-white border-line text-gray-600 hover:border-gray-300"
                }`}
              >
                <Icono size={15} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {pideNota && (
          <form
            className="flex gap-2 mt-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              onMarcar(comida.id, marca.estado, nota.trim() || null);
              setNotaGuardada(true);
            }}
          >
            <input
              value={nota}
              onChange={(e) => {
                setNota(e.target.value);
                setNotaGuardada(false);
              }}
              maxLength={300}
              placeholder="¿Por qué? (opcional) Ej.: no me gustó, era mucho…"
              className="flex-1 min-w-0 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15"
            />
            <button className="text-sm font-medium px-3 rounded-lg bg-nutri-brand text-white hover:bg-nutri-ink cursor-pointer">
              {notaGuardada ? <Check size={16} /> : "Enviar"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

/* ── Compras ────────────────────────────────────────────────────────────── */
function SeccionCompras({ menu }) {
  const [items, setItems] = useState(null);
  const clave = `compras-${menu.id}`;
  const [tachados, setTachados] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(clave)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    obtenerComprasPortal().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  function alternar(id) {
    const nuevos = tachados.includes(id) ? tachados.filter((x) => x !== id) : [...tachados, id];
    setTachados(nuevos);
    try {
      localStorage.setItem(clave, JSON.stringify(nuevos));
    } catch {
      /* sin almacenamiento: la lista funciona igual, solo no se recuerda */
    }
  }

  if (!items) return <div className="esqueleto h-64 rounded-xl" />;
  const total = items.reduce((s, i) => s + i.costo, 0);
  const llave = (i) => `${i.idAlimento}|${i.unidadMedida}`;

  return (
    <div className="bg-white rounded-xl border border-line">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Lista de compras de la semana</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tachados.length} de {items.length} listos · Costo aproximado del menú {total.toFixed(2)}$
          </p>
        </div>
        <ShoppingCart size={20} className="text-nutri-brand" />
      </div>
      <ul className="divide-y divide-line">
        {items.map((i) => {
          const listo = tachados.includes(llave(i));
          return (
            <li key={llave(i)}>
              <label className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={listo}
                  onChange={() => alternar(llave(i))}
                  className="w-4 h-4 accent-[var(--color-nutri-brand)]"
                />
                <span className="flex-1 min-w-0 text-sm">
                  <span className={listo ? "line-through text-gray-400" : ""}>{i.nombre}</span>
                  {i.nota && <span className="block text-xs text-gray-400">{i.nota}</span>}
                </span>
                <span className={`text-sm tabular ${listo ? "text-gray-400" : "text-gray-600"}`}>
                  {cantidadLegible(i.cantidadCompra ?? i.cantidad, i.unidadMedida)}
                  {i.unidadMedida === "unidad" ? " u." : ""}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Progreso ───────────────────────────────────────────────────────────── */
function SeccionProgreso({ perfil }) {
  const [datos, setDatos] = useState(null);
  const [peso, setPeso] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function cargar() {
    return obtenerProgresoPortal().then(setDatos).catch((e) => setMensaje(e.message));
  }
  useEffect(() => {
    cargar();
  }, []);

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    try {
      await registrarPesoPortal(Number(peso), nota);
      setPeso("");
      setNota("");
      setMensaje("¡Listo! Tu nutricionista ya puede ver tu registro.");
      await cargar();
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const pesos = useMemo(() => (datos?.registros || []).filter((r) => r.peso).sort(ordenarControles), [datos]);
  if (!datos) return <div className="esqueleto h-64 rounded-xl" />;

  const ultimo = pesos.at(-1)?.peso ?? perfil?.peso;
  const inicial = datos.pesoPrimerControl ?? datos.pesoInicial ?? perfil?.pesoInicial;
  const diferencia = pesos.length >= 2 && ultimo && inicial ? Math.round((ultimo - inicial) * 10) / 10 : null;
  const cumplimiento = datos.cumplimiento?.porcentaje;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tarjeta titulo="Peso actual" valor={ultimo ? `${ultimo} kg` : "—"} />
        <Tarjeta
          titulo="Cambio desde primer control"
          valor={diferencia === null ? "—" : `${diferencia > 0 ? "+" : ""}${diferencia} kg`}
          detalle={pesos.length >= 2 ? `Registro inicial: ${inicial} kg` : "Registra dos pesos para comparar"}
        />
        <Tarjeta
          titulo="Cumplimiento"
          valor={cumplimiento === null || cumplimiento === undefined ? "—" : `${cumplimiento}%`}
          detalle={
            datos.cumplimiento
              ? `${datos.cumplimiento.comidasMarcadas} de ${datos.cumplimiento.comidasTotales} comidas registradas`
              : "Sin menú aprobado"
          }
        />
      </div>

      <form onSubmit={handleGuardar} className="bg-white rounded-xl border border-line p-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Scale size={18} className="text-nutri-brand" /> Registrar mi peso
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">Lo ideal es una vez por semana, en ayunas y a la misma hora.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-40">
            <input
              type="number"
              step="0.1"
              min="20"
              max="400"
              required
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ej.: 67.5"
              className="w-full text-sm bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 outline-none focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">kg</span>
          </div>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            placeholder="¿Algo que contarle a tu nutricionista? (opcional)"
            className="flex-1 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15"
          />
          <button
            disabled={guardando}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-nutri-brand text-white hover:bg-nutri-ink disabled:opacity-60 cursor-pointer"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
        {mensaje && <p className="text-sm text-nutri-green mt-2">{mensaje}</p>}
      </form>

      <div className="bg-white rounded-xl border border-line p-5">
        <h2 className="font-semibold mb-3">Mi peso en el tiempo</h2>
        {pesos.length === 0 ? (
          <p className="text-sm text-gray-500">Registra tu primer peso para verlo aquí.</p>
        ) : (
          <><GraficaPeso registros={pesos} />{new Set(pesos.map((r) => new Date(r.fecha).toISOString().slice(0, 10))).size === 1 && <p className="text-xs text-gray-500 mt-2">Se muestra el último peso del día. Registra otro día para ver la tendencia.</p>}</>
        )}
      </div>

      {/* "Mi cuerpo": solo si la nutricionista registró medidas corporales */}
      <PanelComposicion registros={datos.registros || []} paraPaciente />
    </div>
  );
}

function Tarjeta({ titulo, valor, detalle }) {
  return (
    <div className="bg-white rounded-xl border border-line p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-2xl font-semibold tabular mt-1">{valor}</p>
      {detalle && <p className="text-xs text-gray-500 mt-1">{detalle}</p>}
    </div>
  );
}

function GraficaPeso({ registros }) {
  const ancho = 600;
  const alto = 180;
  const margen = 28;
  const ultimoPorDia = new Map();
  for (const registro of registros) {
    ultimoPorDia.set(new Date(registro.fecha).toISOString().slice(0, 10), registro);
  }
  const datos = [...ultimoPorDia.values()];
  const valores = datos.map((r) => r.peso);
  const min = Math.min(...valores) - 1;
  const max = Math.max(...valores) + 1;
  const x = (i) => datos.length === 1 ? ancho / 2 : margen + (i * (ancho - 2 * margen)) / (datos.length - 1);
  const y = (v) => alto - margen - ((v - min) * (alto - 2 * margen)) / (max - min);
  const puntos = datos.map((r, i) => `${x(i)},${y(r.peso)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-auto" role="img" aria-label={`Peso: ${valores.join(", ")} kg`}>
      {datos.length > 1 && <polyline points={puntos} fill="none" stroke="var(--color-nutri-brand)" strokeWidth="2.5" strokeLinejoin="round" />}
      {datos.map((r, i) => (
        <g key={r.id}>
          <circle cx={x(i)} cy={y(r.peso)} r="4" fill="white" stroke="var(--color-nutri-brand)" strokeWidth="2" />
          <text x={x(i)} y={y(r.peso) - 10} textAnchor="middle" fontSize="11" fill="var(--color-gray-600)">
            {r.peso}
          </text>
          <text x={x(i)} y={alto - 6} textAnchor="middle" fontSize="10" fill="var(--color-gray-400)">
            {new Date(r.fecha).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default PortalPaciente;

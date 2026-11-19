import { useState } from "react";
import { CupSoda, Loader2, Plus, Search, X } from "lucide-react";
import { buscarInfoNutricional } from "../services/alimentoService";

// Bebida que acompaña una comida. Agua e infusiones sin azúcar no aportan
// calorías. Las preparadas (jugo, batido, colada...) se arman con sus
// ingredientes y cantidades: cada uno se busca en las mismas tablas que los
// alimentos (USDA / USFQ, por 100 g o ml) y se SUMAN a la comida.
const SIN_CALORIAS = [
  "Vaso de agua (250 ml)",
  "Agua aromática sin azúcar (manzanilla, hierba luisa o cedrón)",
  "Agua de canela sin azúcar",
  "Té verde sin azúcar",
];

const AZUCAR = { nombre: "Azúcar", cantidad: 2, unidad: "cdta" };
const AGUA = { nombre: "Agua", cantidad: 200, unidad: "ml" };
const CON_CALORIAS = [
  { etiqueta: "Jugo de fruta sin azúcar", nombre: "Jugo natural de mora sin azúcar", ingredientes: [{ nombre: "Mora", cantidad: 100, unidad: "g" }, AGUA] },
  { etiqueta: "Jugo de fruta con azúcar", nombre: "Jugo natural de mora con azúcar", ingredientes: [{ nombre: "Mora", cantidad: 100, unidad: "g" }, AGUA, AZUCAR] },
  { etiqueta: "Batido de fruta sin azúcar", nombre: "Batido de guineo con leche sin azúcar", ingredientes: [{ nombre: "Guineo", cantidad: 120, unidad: "g" }, { nombre: "Leche entera", cantidad: 1, unidad: "taza" }] },
  { etiqueta: "Batido de fruta con azúcar", nombre: "Batido de guineo con leche y azúcar", ingredientes: [{ nombre: "Guineo", cantidad: 120, unidad: "g" }, { nombre: "Leche entera", cantidad: 1, unidad: "taza" }, AZUCAR] },
  { etiqueta: "Colada de fruta sin azúcar", nombre: "Colada de avena con naranjilla sin azúcar", ingredientes: [{ nombre: "Avena en hojuelas", cantidad: 20, unidad: "g" }, { nombre: "Naranjilla", cantidad: 60, unidad: "g" }, { ...AGUA, cantidad: 250 }] },
  { etiqueta: "Colada de fruta con azúcar", nombre: "Colada de avena con naranjilla con azúcar", ingredientes: [{ nombre: "Avena en hojuelas", cantidad: 20, unidad: "g" }, { nombre: "Naranjilla", cantidad: 60, unidad: "g" }, { ...AGUA, cantidad: 250 }, AZUCAR] },
  { etiqueta: "Yogur de fruta", nombre: "Yogur de fruta", ingredientes: [{ nombre: "Yogur de frutas", cantidad: 200, unidad: "ml" }] },
  { etiqueta: "Leche semidescremada", nombre: "Vaso de leche semidescremada", ingredientes: [{ nombre: "Leche semidescremada", cantidad: 250, unidad: "ml" }] },
];
// Lo que más se agrega a batidos y jugos
const EXTRAS = ["Leche entera", "Leche de soya", "Leche de avena", "Azúcar", "Panela", "Splenda", "Agua"];

// Medidas caseras -> g o ml
const UNIDADES = {
  g: { texto: "g", factor: 1, base: "g" },
  ml: { texto: "ml", factor: 1, base: "ml" },
  taza: { texto: "taza (240 ml)", factor: 240, base: "ml" },
  cda: { texto: "cda (15 g)", factor: 15, base: "g" },
  cdta: { texto: "cdta (5 g)", factor: 5, base: "g" },
};
// Sin calorías: no hace falta buscarlos
const ES_SIN_CALORIAS = /^(agua|agua hervida|hielo|splenda|stevia|sucralosa|edulcorante.*)$/i;

const fmt = (n, d = 0) => Number(n || 0).toLocaleString("es-EC", { maximumFractionDigits: d });
let siguienteId = 1;

const sinTildes = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Ingredientes locales (panela, naranjilla, mora...): si la tabla USFQ
// (Ecuador) tiene uno que empieza igual que lo buscado, se prefiere a USDA
function elegirFicha(r, termino) {
  const primera = sinTildes(termino).split(/[^a-z]+/)[0];
  const usfq = r.fuente === "USFQ" ? r : r.alternativa?.fuente === "USFQ" ? r.alternativa : null;
  const otra = usfq === r ? r.alternativa : r;
  if (usfq && primera && sinTildes(usfq.nombreEncontrado).startsWith(primera)) return { ficha: usfq, alternativa: otra || null };
  return { ficha: r, alternativa: r.alternativa || null };
}

function nuevaFila({ nombre = "", cantidad = "", unidad = "g", por100 = null, fuente = null, referencia = null } = {}) {
  return { id: siguienteId++, nombre, cantidad: String(cantidad), unidad, por100, fuente, referencia, alternativa: null, buscando: false, error: "" };
}

function cantidadBase(fila) {
  return (Number(fila.cantidad) || 0) * (UNIDADES[fila.unidad]?.factor || 1);
}

function medidaCasera(fila) {
  const u = UNIDADES[fila.unidad];
  if (!u || u.factor === 1) return null;
  const n = Number(fila.cantidad) || 0;
  const nombre = fila.unidad === "taza" ? (n === 1 ? "taza" : "tazas") : fila.unidad;
  return `${fmt(n, 2)} ${nombre}`;
}

function sinKcal(fila) {
  return ES_SIN_CALORIAS.test(fila.nombre.trim());
}

function kcalFila(fila) {
  if (sinKcal(fila)) return 0;
  return fila.por100 ? (Number(fila.por100.calorias) || 0) * cantidadBase(fila) / 100 : null;
}

// Filas al abrir el editor con una bebida ya guardada
function filasIniciales(comida) {
  const previa = comida.bebidaNutricion;
  if (previa?.ingredientes?.length) {
    return previa.ingredientes.map((i) => {
      const casera = i.medida && Object.entries(UNIDADES).find(([, u]) => u.factor > 1 && i.cantidad % u.factor === 0 && i.medida.includes(u.texto.split(" ")[0]));
      return nuevaFila({
        nombre: i.nombre,
        cantidad: casera ? i.cantidad / casera[1].factor : i.cantidad,
        unidad: casera ? casera[0] : i.unidad,
        por100: i.por100, fuente: i.fuente, referencia: i.referencia,
      });
    });
  }
  // Bebida de una sola ficha (versión anterior)
  if (previa?.nutrientes && previa.ml) {
    const por100 = Object.fromEntries(Object.entries(previa.nutrientes).map(([k, v]) => [k, (v * 100) / previa.ml]));
    return [nuevaFila({ nombre: previa.referencia || comida.bebida, cantidad: previa.ml, unidad: "ml", por100, fuente: previa.fuente, referencia: previa.referencia })];
  }
  return [];
}

export function EditorBebida({ idPaciente, comida, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(comida.bebida || "");
  const [filas, setFilas] = useState(() => filasIniciales(comida));
  const [conCalorias, setConCalorias] = useState(() => filas.length > 0);
  // ml servidos: por defecto la suma de los ingredientes
  const [mlManual, setMlManual] = useState(() => (comida.bebidaNutricion?.ml ? String(comida.bebidaNutricion.ml) : ""));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cambiarFila = (id, cambios) => setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, ...cambios } : f)));

  async function buscarFila(fila) {
    if (!fila.nombre.trim() || sinKcal(fila)) return;
    cambiarFila(fila.id, { buscando: true, error: "", por100: null });
    try {
      const r = await buscarInfoNutricional(idPaciente, fila.nombre.trim());
      if (!r || r.calorias == null) cambiarFila(fila.id, { buscando: false, error: "No está en las tablas; prueba un nombre más simple" });
      else {
        const { ficha, alternativa } = elegirFicha(r, fila.nombre);
        cambiarFila(fila.id, { buscando: false, por100: ficha, fuente: ficha.fuente, referencia: ficha.nombreEncontrado, alternativa: alternativa?.calorias != null ? alternativa : null });
      }
    } catch (err) {
      cambiarFila(fila.id, { buscando: false, error: err.message || "No se pudo consultar" });
    }
  }

  function agregarFilas(datos) {
    const nuevas = datos.map((d) => nuevaFila(d));
    setFilas((fs) => [...fs, ...nuevas]);
    nuevas.forEach(buscarFila);
  }

  function elegirSinCalorias(texto) {
    setNombre(texto);
    setConCalorias(false);
    setFilas([]);
    setMlManual("");
    setError("");
  }

  function elegirConCalorias(op) {
    setNombre(op.nombre);
    setConCalorias(true);
    setMlManual("");
    setError("");
    setFilas([]);
    agregarFilas(op.ingredientes);
  }

  function agregarExtra(nombreExtra) {
    const u = /^(leche|agua)/i.test(nombreExtra) ? (nombreExtra === "Agua" ? { cantidad: 200, unidad: "ml" } : { cantidad: 1, unidad: "taza" })
      : nombreExtra === "Splenda" ? { cantidad: 1, unidad: "g" } : { cantidad: 2, unidad: "cdta" };
    agregarFilas([{ nombre: nombreExtra, ...u }]);
  }

  const mlCalculado = Math.round(filas.reduce((t, f) => t + cantidadBase(f), 0));
  const ml = Number(mlManual) > 0 ? Number(mlManual) : mlCalculado;
  const kcalTotal = filas.reduce((t, f) => t + (kcalFila(f) || 0), 0);
  const pendientes = filas.filter((f) => f.nombre.trim() && kcalFila(f) === null);
  const buscando = filas.some((f) => f.buscando);

  async function guardar(quitar = false) {
    setError("");
    const validas = filas.filter((f) => f.nombre.trim());
    if (!quitar && conCalorias) {
      if (validas.length === 0) { setError("Agrega al menos un ingrediente, o elige una bebida sin calorías."); return; }
      if (pendientes.length) { setError(`Falta buscar en las tablas: ${pendientes.map((f) => f.nombre).join(", ")}.`); return; }
      if (validas.some((f) => !(cantidadBase(f) > 0))) { setError("Indica la cantidad de cada ingrediente."); return; }
      if (!(ml >= 10 && ml <= 1000)) { setError("La cantidad servida debe estar entre 10 y 1000 ml."); return; }
    }
    setGuardando(true);
    try {
      if (quitar) await onGuardar({ bebida: null });
      else if (conCalorias) {
        await onGuardar({
          bebida: nombre.trim(),
          ml,
          ingredientes: validas.map((f) => ({
            nombre: f.nombre.trim(),
            cantidad: cantidadBase(f),
            unidad: UNIDADES[f.unidad]?.base || "g",
            medida: medidaCasera(f),
            sinCalorias: sinKcal(f),
            por100: sinKcal(f) ? null : f.por100,
            fuente: f.fuente,
            referencia: f.referencia,
          })),
        });
      } else await onGuardar({ bebida: nombre.trim() });
    } catch (err) {
      setError(err.message || "No se pudo guardar");
      setGuardando(false);
    }
  }

  const chip = (activo) => `text-xs rounded-full px-3 py-1.5 border transition-colors ${activo ? "border-nutri-brand bg-nutri-brand text-white" : "border-line text-gray-600 hover:border-nutri-brand"}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Bebida para <strong>{comida.tipoComida.toLowerCase()}</strong> · {comida.nombrePlato}</p>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Sin calorías</p>
        <div className="flex flex-wrap gap-2">
          {SIN_CALORIAS.map((s) => <button key={s} type="button" onClick={() => elegirSinCalorias(s)} aria-pressed={nombre === s} className={chip(nombre === s)}>{s}</button>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Preparadas (se suman a la comida)</p>
        <div className="flex flex-wrap gap-2">
          {CON_CALORIAS.map((op) => <button key={op.etiqueta} type="button" onClick={() => elegirConCalorias(op)} aria-pressed={nombre === op.nombre} className={chip(nombre === op.nombre)}>{op.etiqueta}</button>)}
        </div>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-nutri-ink">Nombre de la bebida (así lo verá el paciente)</span>
          <input type="text" value={nombre} maxLength={160} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Batido de guineo con leche de soya"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-nutri-ink">
          <input type="checkbox" checked={conCalorias} onChange={(e) => { setConCalorias(e.target.checked); if (!e.target.checked) setFilas([]); }} />
          Es preparada o tiene calorías (jugo, batido, colada, leche…)
        </label>

        {conCalorias && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">Ingredientes y cantidades</p>
            {filas.length === 0 && <p className="text-xs text-gray-500">Elige una bebida de arriba o agrega ingredientes.</p>}
            <ul className="space-y-2">
              {filas.map((f) => {
                const kcal = kcalFila(f);
                return (
                  <li key={f.id} className="rounded-lg bg-surface p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input type="text" value={f.nombre} aria-label="Ingrediente" placeholder="Ingrediente"
                        onChange={(e) => cambiarFila(f.id, { nombre: e.target.value, por100: null, error: "" })}
                        onBlur={() => { if (!f.por100) buscarFila(f); }}
                        className="min-w-0 flex-1 basis-36 rounded-md border border-line px-2 py-1.5 text-sm bg-white" />
                      <input type="number" min="0" step="any" value={f.cantidad} aria-label={`Cantidad de ${f.nombre || "ingrediente"}`}
                        onChange={(e) => cambiarFila(f.id, { cantidad: e.target.value })}
                        className="w-16 rounded-md border border-line px-2 py-1.5 text-sm bg-white" />
                      <select value={f.unidad} aria-label="Medida" onChange={(e) => cambiarFila(f.id, { unidad: e.target.value })}
                        className="rounded-md border border-line px-1.5 py-1.5 text-sm bg-white">
                        {Object.entries(UNIDADES).map(([k, u]) => <option key={k} value={k}>{u.texto}</option>)}
                      </select>
                      <button type="button" onClick={() => setFilas((fs) => fs.filter((x) => x.id !== f.id))} aria-label={`Quitar ${f.nombre || "ingrediente"}`} className="p-1 text-gray-400 hover:text-nutri-pink">
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                      {f.buscando ? <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" aria-hidden="true" />Buscando en las tablas…</span>
                        : kcal !== null ? <strong className="text-xs text-nutri-ink tabular">{fmt(kcal)} kcal</strong>
                          : f.nombre.trim() && <button type="button" onClick={() => buscarFila(f)} className="inline-flex items-center gap-1 font-semibold text-nutri-brand"><Search size={12} aria-hidden="true" />Buscar en tablas</button>}
                      {f.error ? <span className="text-nutri-pink">{f.error}</span>
                        : sinKcal(f) ? <span>Sin calorías</span>
                          : f.referencia && <span>{f.fuente || "Tabla"} · {f.referencia} · {fmt(f.por100?.calorias)} kcal/100</span>}
                      {f.alternativa && !f.buscando && (
                        <button type="button" className="font-semibold text-nutri-brand"
                          onClick={() => cambiarFila(f.id, { por100: f.alternativa, fuente: f.alternativa.fuente, referencia: f.alternativa.nombreEncontrado, alternativa: { ...f.por100, fuente: f.fuente, nombreEncontrado: f.referencia } })}>
                          Usar {f.alternativa.fuente}: {f.alternativa.nombreEncontrado}
                        </button>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500">Agregar:</span>
              {EXTRAS.map((x) => (
                <button key={x} type="button" onClick={() => agregarExtra(x)} className="inline-flex items-center gap-0.5 text-xs rounded-full border border-line px-2 py-1 text-gray-600 hover:border-nutri-brand">
                  <Plus size={12} aria-hidden="true" />{x}
                </button>
              ))}
              <button type="button" onClick={() => setFilas((fs) => [...fs, nuevaFila()])} className="inline-flex items-center gap-0.5 text-xs rounded-full border border-dashed border-nutri-brand px-2 py-1 font-semibold text-nutri-brand">
                <Plus size={12} aria-hidden="true" />Otro ingrediente
              </button>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-2 border-t border-line pt-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Cantidad servida</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <input type="number" min="10" max="1000" step="10" value={mlManual} placeholder={String(mlCalculado || "")}
                    onChange={(e) => setMlManual(e.target.value)} className="w-24 rounded-lg border border-line px-3 py-1.5 text-sm" />
                  <span className="text-sm text-gray-500">ml</span>
                </span>
              </label>
              <p className="text-sm font-semibold text-nutri-ink">Total: {fmt(kcalTotal)} kcal{buscando && " …"}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {conCalorias ? "Las calorías de los ingredientes se suman a la comida y al día, y la preparación de la bebida se agrega a la explicación del plato." : "Agua e infusiones sin azúcar no suman calorías."}
      </p>
      {error && <p className="text-sm text-nutri-pink">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
        {comida.bebida && (
          <button type="button" disabled={guardando} onClick={() => guardar(true)} className="mr-auto px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-nutri-pink">Quitar bebida</button>
        )}
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-lg border border-line text-sm">Cancelar</button>
        <button type="button" disabled={guardando || buscando || !nombre.trim()} onClick={() => guardar(false)}
          className="px-4 py-2 rounded-lg bg-nutri-brand text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
          {guardando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Guardar bebida
        </button>
      </div>
    </div>
  );
}

// Nombre del plato con la bebida al lado, del mismo tamaño, para que el
// paciente la vea (en letra pequeña se la saltaba):
// "Huevos duros con arroz + 🥤 Jugo de mora sin azúcar"
export function NombreConBebida({ nombrePlato, bebida }) {
  return (
    <>
      {nombrePlato}
      {bebida && (
        <span className="nombre-bebida">
          {" + "}
          <CupSoda size="0.95em" strokeWidth={2.4} className="inline-block align-[-0.12em] mr-0.5" aria-hidden="true" />
          {bebida}
        </span>
      )}
    </>
  );
}

// Tarjeta de la bebida dentro de la comida: nombre, cantidad, calorías e
// ingredientes (si es preparada)
export function TarjetaBebida({ bebida, nutricion, className = "" }) {
  if (!bebida) return null;
  const ingredientes = nutricion?.ingredientes || [];
  const kcal = Math.round(nutricion?.nutrientes?.calorias || 0);
  return (
    <div className={`tarjeta-bebida ${className}`}>
      <span className="tarjeta-bebida-icono"><CupSoda size={18} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="tarjeta-bebida-titulo">Bebida</p>
        <p className="tarjeta-bebida-nombre">{bebida}</p>
        {ingredientes.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {ingredientes.map((i, k) => (
              <li key={k} className="tarjeta-bebida-chip">{i.nombre} · {i.medida || `${fmt(i.cantidad)} ${i.unidad}`}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="tarjeta-bebida-datos">
        {nutricion?.ml ? <span>{nutricion.ml} ml</span> : null}
        <strong>{kcal > 0 ? `${kcal} kcal` : "0 kcal"}</strong>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Smartphone } from "lucide-react";
import { obtenerAccesoPaciente, guardarAccesoPaciente, quitarAccesoPaciente } from "../services/portalService";

const inputClass =
  "w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15";

// El nutricionista crea (o cambia) el correo y la contraseña con los que su
// paciente entra a la app para ver su menú aprobado y registrar su avance
function AccesoPaciente({ paciente }) {
  const [acceso, setAcceso] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    obtenerAccesoPaciente(paciente.id)
      .then((a) => {
        setAcceso(a);
        setEmail(a.email || "");
      })
      .catch((e) => setMensaje({ tipo: "error", texto: e.message }));
  }, [paciente.id]);

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const a = await guardarAccesoPaciente(paciente.id, { email, password: password || undefined });
      setAcceso(a);
      setMensaje({
        tipo: "ok",
        texto: password
          ? `Listo. Comparte con ${paciente.nombre.split(" ")[0]} su correo y la contraseña para que entre como "Paciente".`
          : "Correo actualizado. La contraseña sigue siendo la misma.",
      });
      setPassword("");
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  async function handleQuitar() {
    if (!confirm(`¿Quitar el acceso de ${paciente.nombre} a la app?`)) return;
    try {
      await quitarAccesoPaciente(paciente.id);
      setAcceso({ tieneAcceso: false, email: null });
      setEmail("");
      setMensaje({ tipo: "ok", texto: "Acceso quitado. El paciente ya no puede entrar." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  }

  if (!acceso) return <div className="esqueleto h-48 rounded-lg" />;

  return (
    <div>
      <div
        className={`flex items-start gap-3 rounded-lg p-3 mb-5 ${
          acceso.tieneAcceso ? "bg-nutri-green/10 text-nutri-green" : "bg-surface text-gray-600"
        }`}
      >
        <Smartphone size={18} className="shrink-0 mt-0.5" />
        <p className="text-sm">
          {acceso.tieneAcceso ? (
            <>
              <span className="font-semibold">Tiene acceso a la app</span> con <span className="font-semibold">{acceso.email}</span>.
              Ve su menú aprobado, marca lo que come y registra su peso.
            </>
          ) : (
            <>
              <span className="font-semibold">Todavía no tiene acceso.</span> Crea su correo y contraseña para que vea su menú
              aprobado y registre su avance desde el celular.
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-4">
        <div>
          <label htmlFor="acceso-email" className="block mb-1 text-xs font-medium text-gray-600">
            Correo del paciente *
          </label>
          <input
            id="acceso-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="paciente@correo.com"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="acceso-pass" className="block mb-1 text-xs font-medium text-gray-600">
            {acceso.tieneAcceso ? "Nueva contraseña (déjala vacía para no cambiarla)" : "Contraseña *"}
          </label>
          <div className="relative">
            <input
              id="acceso-pass"
              type={verPassword ? "text" : "password"}
              required={!acceso.tieneAcceso}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setVerPassword(!verPassword)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-nutri-ink"
            >
              {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mensaje.texto && (
          <p className={`text-sm ${mensaje.tipo === "error" ? "text-nutri-pink" : "text-nutri-green"}`}>{mensaje.texto}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            disabled={guardando}
            className="inline-flex items-center gap-2 bg-nutri-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-nutri-ink disabled:opacity-60 cursor-pointer"
          >
            <KeyRound size={15} />
            {guardando ? "Guardando…" : acceso.tieneAcceso ? "Guardar cambios" : "Crear acceso"}
          </button>
          {acceso.tieneAcceso && (
            <button
              type="button"
              onClick={handleQuitar}
              className="text-sm px-3 py-2 rounded-lg text-nutri-pink hover:bg-nutri-pink/5 cursor-pointer"
            >
              Quitar acceso
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AccesoPaciente;

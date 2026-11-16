import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { registrarNutriologo } from "../services/authService";

const inputClass =
  "w-full text-sm bg-white border border-gray-300 rounded-lg px-4 py-3 text-nutri-ink placeholder-gray-400 outline-none transition-colors focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15";

function Login() {
  const { login, loginPaciente } = useAuth();
  // "nutriologo" o "paciente": cada uno entra a su propio panel
  const [rol, setRol] = useState("nutriologo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  // El nutricionista puede crear su cuenta (con el código de invitación que
  // le da quien administra la app); el paciente no: su acceso lo crea su nutricionista
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [codigo, setCodigo] = useState("");
  const modoCrear = creando && rol === "nutriologo";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (rol === "paciente") await loginPaciente(email, password);
      else {
        if (modoCrear) await registrarNutriologo({ nombre, apellido, email, password, codigoInvitacion: codigo });
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panel de marca */}
      <section className="hidden lg:flex flex-col justify-between bg-nutri-ink text-white p-14">
        <Logo size={34} light />
        <div className="max-w-md">
          <h1 className="text-5xl font-semibold leading-[1.1]" style={{ letterSpacing: "-0.02em" }}>
            Planes de alimentación claros para cada paciente.
          </h1>
          <p className="mt-6 text-lg text-white/70 leading-relaxed">
            Registra pacientes, arma menús según su presupuesto y da seguimiento a su progreso en un solo lugar.
          </p>
        </div>
        <p className="text-sm text-white/40">© {new Date().getFullYear()} NutriApp</p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <Logo size={32} />
          </div>

          <h2 className="text-3xl font-semibold" style={{ letterSpacing: "-0.02em" }}>
            {modoCrear ? "Crear cuenta" : "Iniciar sesión"}
          </h2>
          <div role="tablist" aria-label="Tipo de cuenta" className="grid grid-cols-2 gap-1 p-1 mt-6 rounded-full bg-surface border border-line">
            {[
              ["nutriologo", "Nutricionista"],
              ["paciente", "Paciente"],
            ].map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={rol === valor}
                onClick={() => {
                  setRol(valor);
                  setError("");
                }}
                className={`py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  rol === valor ? "bg-nutri-ink text-white shadow-sm" : "text-gray-500 hover:text-nutri-ink"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
          <p className="text-gray-500 mt-4 mb-8">
            {rol === "paciente"
              ? "Ingresa con el correo y la contraseña que te dio tu nutricionista."
              : modoCrear
                ? "Crea tu cuenta de nutricionista con el código de invitación que recibiste."
                : "Ingresa con tu cuenta de nutricionista."}
          </p>

          {error && (
            <div className="flex items-center gap-2.5 text-sm mb-5 px-4 py-3 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">
              <svg viewBox="0 0 20 20" width="16" fill="currentColor" className="shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {modoCrear && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-nombre" className="block text-sm font-medium mb-2">Nombre</label>
                  <input id="reg-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="reg-apellido" className="block text-sm font-medium mb-2">Apellido</label>
                  <input id="reg-apellido" required value={apellido} onChange={(e) => setApellido(e.target.value)} autoComplete="family-name" className={inputClass} />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={modoCrear ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-nutri-ink"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? (
                    <svg viewBox="0 0 20 20" width="17" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                      <circle cx="10" cy="10" r="2.5"/>
                      <line x1="3" y1="3" x2="17" y2="17"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" width="17" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                      <circle cx="10" cy="10" r="2.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {modoCrear && (
              <div>
                <label htmlFor="reg-codigo" className="block text-sm font-medium mb-2">Código de invitación</label>
                <input id="reg-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Te lo da quien administra NutriApp" autoComplete="off" className={inputClass} />
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full font-semibold text-white bg-nutri-ink hover:bg-nutri-ink-soft py-3 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{ marginTop: 28 }}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  {modoCrear ? "Creando cuenta…" : "Ingresando…"}
                </span>
              ) : (
                modoCrear ? "Crear cuenta" : "Ingresar"
              )}
            </button>
          </form>

          {rol === "nutriologo" && (
            <p className="text-sm text-gray-500 text-center mt-6">
              {modoCrear ? "¿Ya tienes cuenta?" : "¿Eres nutricionista y no tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setCreando(!creando);
                  setError("");
                }}
                className="font-semibold text-nutri-brand hover:underline cursor-pointer"
              >
                {modoCrear ? "Inicia sesión" : "Crear cuenta"}
              </button>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Login;

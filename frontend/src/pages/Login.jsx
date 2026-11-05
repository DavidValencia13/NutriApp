import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";

const inputClass =
  "w-full text-sm bg-white border border-gray-300 rounded-lg px-4 py-3 text-nutri-ink placeholder-gray-400 outline-none transition-colors focus:border-nutri-brand focus:ring-2 focus:ring-nutri-brand/15";

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
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
            Iniciar sesión
          </h2>
          <p className="text-gray-500 mt-2 mb-8">Ingresa con tu cuenta de nutriólogo.</p>

          {error && (
            <div className="flex items-center gap-2.5 text-sm mb-5 px-4 py-3 rounded-lg border border-nutri-pink/30 bg-nutri-pink/5 text-nutri-pink">
              <svg viewBox="0 0 20 20" width="16" fill="currentColor" className="shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  autoComplete="current-password"
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
                  Ingresando…
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;

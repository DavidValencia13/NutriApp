import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#070E1A" }}
    >
      {/* Ambient orbs */}
      <div className="orb animate-fade-in" style={{
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(14,207,199,0.18) 0%, transparent 70%)",
        top: "-120px", right: "-80px", animation: "drift 20s ease-in-out infinite",
      }} />
      <div className="orb" style={{
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)",
        bottom: "-80px", left: "-60px", animation: "drift 28s ease-in-out infinite",
        animationDelay: "-8s",
      }} />

      {/* Card */}
      <div
        className="relative w-full max-w-[420px] animate-scale-in"
        style={{
          background: "rgba(13,24,41,0.85)",
          border: "1px solid rgba(56,189,248,0.1)",
          borderRadius: 20,
          padding: "40px 36px 36px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,207,199,0.05)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center font-display font-bold text-white"
            style={{
              width: 44, height: 44,
              borderRadius: 13,
              background: "linear-gradient(135deg, #0ECFC7 0%, #0BA89F 100%)",
              fontSize: 20,
              boxShadow: "0 4px 18px rgba(14,207,199,0.4)",
              flexShrink: 0,
            }}
          >
            N
          </div>
          <div>
            <p className="font-display font-bold text-white text-xl leading-none" style={{ letterSpacing: "-0.4px" }}>
              NutriApp
            </p>
            <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: "rgba(148,163,184,0.7)" }}>
              Gestión nutricional
            </p>
          </div>
        </div>

        <h2
          className="font-display font-bold mb-1"
          style={{ fontSize: 22, color: "#E2E8F0", letterSpacing: "-0.4px" }}
        >
          Bienvenido de nuevo
        </h2>
        <p className="text-sm mb-7" style={{ color: "#64748B" }}>
          Ingresa a tu plataforma nutricional
        </p>

        {error && (
          <div
            className="flex items-center gap-2.5 text-sm mb-5 px-4 py-3 rounded-xl animate-fade-in"
            style={{
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "#F87171",
            }}
          >
            <svg viewBox="0 0 20 20" width="16" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-[12px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: "#94A3B8" }}
            >
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
              className="w-full text-sm placeholder-slate-600 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(56,189,248,0.1)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#E2E8F0",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(14,207,199,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(14,207,199,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "rgba(56,189,248,0.1)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-pass"
              className="block text-[12px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: "#94A3B8" }}
            >
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
                className="w-full text-sm placeholder-slate-600 outline-none transition-all duration-200 pr-12"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(56,189,248,0.1)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#E2E8F0",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(14,207,199,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(14,207,199,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(56,189,248,0.1)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "#475569" }}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={cargando}
            className="btn-glow w-full font-display font-semibold text-sm text-white py-3 rounded-xl mt-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0ECFC7 0%, #0BA89F 100%)",
              borderRadius: 12,
              letterSpacing: "-0.1px",
              marginTop: 24,
            }}
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

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(100,116,139,0.6)" }}
        >
          NutriApp © 2025 — Plataforma profesional de nutrición
        </p>
      </div>
    </div>
  );
}

export default Login;

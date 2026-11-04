/* Marca de NutriApp: hoja dentro de un cuadrado redondeado (misma que favicon.svg) */
export function LogoMark({ size = 32, tile = "#1F7A52", leaf = "#EAF7EF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={tile} />
      <path d="M8.5 23.5C8.5 14 14 8.5 24 8.5C24 18.5 18 23.5 8.5 23.5Z" fill={leaf} />
      <path d="M8.5 23.5L18.5 13.5" stroke={tile} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 32, light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className="font-bold leading-none"
        style={{ fontSize: size * 0.56, color: light ? "#fff" : "var(--color-nutri-ink)", letterSpacing: "-0.02em" }}
      >
        NutriApp
      </span>
    </div>
  );
}

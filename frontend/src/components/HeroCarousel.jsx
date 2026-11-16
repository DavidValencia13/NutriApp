import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clinicPanorama from "../assets/clinic-panorama.webp";

// Contenido de funciones existentes. Puede sustituirse por noticias cuando exista una fuente real.
const slides = [
  {
    id: "consulta",
    eyebrow: "TU ESPACIO CLÍNICO",
    firstLine: "Datos en orden.",
    secondLine: "Atención con criterio.",
    description: "Revisa perfiles, cobertura de alimentos y seguimiento de tus pacientes desde una misma vista.",
  },
  {
    id: "alimentos",
    eyebrow: "COBERTURA DE ALIMENTOS",
    firstLine: "Cada menú empieza",
    secondLine: "con buenos datos.",
    description: "Identifica los catálogos que necesitan alimentos antes de preparar un plan.",
  },
  {
    id: "seguimiento",
    eyebrow: "SEGUIMIENTO CLÍNICO",
    firstLine: "Cada avance",
    secondLine: "merece contexto.",
    description: "Consulta la evolución de cada paciente desde su expediente.",
  },
];

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") setActive((index) => (index + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [paused, reducedMotion]);

  const goTo = (index) => setActive((index + slides.length) % slides.length);

  return (
    <section
      id="resumen"
      className="dashboard-hero"
      aria-label="Novedades del espacio clínico"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      <div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-slide hero-slide-${slide.id}`}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            <div className="hero-doctor-photo" aria-hidden="true" style={{ backgroundImage: `url(${clinicPanorama})` }} />
            <div className="hero-copy">
              <span className="hero-kicker"><span className="live-dot" />{slide.eyebrow}</span>
              <h2>{slide.firstLine}<br /><span>{slide.secondLine}</span></h2>
              <p>{slide.description}</p>
            </div>
            <div className="hero-clinical-visual" aria-hidden="true">
              <span className="hero-visual-orbit" />
              <div className="hero-glass-panel">
                <div className="hero-glass-heading"><span>VISIÓN CLÍNICA</span><span className="hero-glass-signal"><i /><i /><i /></span></div>
                <svg className="hero-pulse-line" viewBox="0 0 260 64" fill="none" preserveAspectRatio="none">
                  <path d="M0 34h52l11-1 8-14 11 32 11-40 13 23h27l9-8 10 15 10-7h100" stroke={`url(#clinical-pulse-${slide.id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs><linearGradient id={`clinical-pulse-${slide.id}`} x1="0" x2="260" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#64eeb3" stopOpacity=".5"/><stop offset=".5" stopColor="#79ffbc"/><stop offset="1" stopColor="#8bdcf1" stopOpacity=".55"/></linearGradient></defs>
                </svg>
                <div className="hero-glass-modules"><span>Expediente</span><span>Alimentos</span><span>Seguimiento</span></div>
              </div>
              <span className="hero-visual-spark hero-visual-spark-one" />
              <span className="hero-visual-spark hero-visual-spark-two" />
            </div>
          </article>
        ))}
      </div>
      <div className="hero-controls" aria-label="Controles de novedades">
        <button type="button" className="hero-arrow" onClick={() => goTo(active - 1)} aria-label="Tarjeta anterior"><ChevronLeft size={16} /></button>
        <div className="hero-dots">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={index === active ? "active" : ""}
              onClick={() => goTo(index)}
              aria-label={`Mostrar tarjeta ${index + 1}: ${slide.eyebrow.toLowerCase()}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
        <button type="button" className="hero-arrow" onClick={() => goTo(active + 1)} aria-label="Tarjeta siguiente"><ChevronRight size={16} /></button>
      </div>
    </section>
  );
}

export default HeroCarousel;

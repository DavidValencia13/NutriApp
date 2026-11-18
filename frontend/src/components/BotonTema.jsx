import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { aplicarTema, temaGuardado } from "../utils/tema";

// Botón luna / sol para cambiar entre modo claro y oscuro
function BotonTema({ className = "", conTexto = false }) {
  const [tema, setTema] = useState(temaGuardado);

  useEffect(() => {
    const alCambiar = (e) => setTema(e.detail);
    window.addEventListener("nutriapp-tema", alCambiar);
    return () => window.removeEventListener("nutriapp-tema", alCambiar);
  }, []);

  const oscuro = tema === "oscuro";
  const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <button type="button" onClick={() => aplicarTema(oscuro ? "claro" : "oscuro")} aria-label={etiqueta} title={etiqueta} className={className}>
      {oscuro ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {conTexto && <span>{oscuro ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}

export default BotonTema;

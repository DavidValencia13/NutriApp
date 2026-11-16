import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Aviso flotante mientras el servidor de la nube "despierta" (el plan gratis
// se duerme tras un rato sin uso y la primera visita tarda unos segundos)
function AvisoServidor() {
  const [lento, setLento] = useState(false);
  useEffect(() => {
    const cambiar = (e) => setLento(Boolean(e.detail));
    window.addEventListener("servidor-lento", cambiar);
    return () => window.removeEventListener("servidor-lento", cambiar);
  }, []);
  if (!lento) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2.5 bg-nutri-ink text-white text-sm px-4 py-2.5 rounded-full shadow-lg animate-fade-in-up"
    >
      <Loader2 size={16} className="animate-spin text-nutri-mint" aria-hidden="true" />
      Conectando con el servidor… la primera vez puede tardar unos segundos
    </div>
  );
}

export default AvisoServidor;

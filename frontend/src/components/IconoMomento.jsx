import { Apple, Coffee, Moon, MoonStar, Sunrise, Utensils, UtensilsCrossed } from "lucide-react";

// Ícono de línea (Lucide) por momento del día
const ICONOS_POR_MOMENTO = [
  [/desayuno/, Sunrise],
  [/media ma/, Apple],
  [/almuerzo/, UtensilsCrossed],
  [/merienda/, Coffee],
  [/antes de dormir/, MoonStar],
  [/cena/, Moon],
];

function IconoMomento({ tipoComida, tamano = "sm" }) {
  const texto = (tipoComida || "").toLowerCase();
  const Icono = ICONOS_POR_MOMENTO.find(([regex]) => regex.test(texto))?.[1] || Utensils;
  const grande = tamano === "lg";
  return (
    <span
      className={`flex items-center justify-center rounded-md bg-nutri-brand/10 text-nutri-brand shrink-0 ${
        grande ? "w-10 h-10 rounded-xl" : "w-6 h-6"
      }`}
    >
      <Icono size={grande ? 20 : 14} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export default IconoMomento;

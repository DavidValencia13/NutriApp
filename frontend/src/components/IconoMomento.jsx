import NutriIcon from "./NutriIcon";

const ICONOS_POR_MOMENTO = [
  [/desayuno/, "desayuno"],
  [/media ma/, "merienda"],
  [/almuerzo/, "almuerzo"],
  [/merienda/, "merienda"],
  [/antes de dormir/, "cena"],
  [/cena/, "cena"],
];

function IconoMomento({ tipoComida, tamano = "sm" }) {
  const texto = (tipoComida || "").toLowerCase();
  const icono = ICONOS_POR_MOMENTO.find(([regex]) => regex.test(texto))?.[1] || "comida";
  const grande = tamano === "lg";
  return (
    <span
      className={`nutri-moment-icon flex items-center justify-center rounded-md shrink-0 ${
        grande ? "w-10 h-10 rounded-xl" : "w-6 h-6"
      }`}
      data-kind={icono}
    >
      <NutriIcon name={icono} size={grande ? 25 : 18} />
    </span>
  );
}

export default IconoMomento;

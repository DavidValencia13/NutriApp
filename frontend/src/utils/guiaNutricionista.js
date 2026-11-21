// Pasos del recorrido guiado del nutricionista (siguen el flujo real del
// programa). selector = valor de data-tour del elemento que se ilumina.
// Si se agregan novedades, subir VERSION_GUIA para que se muestre de nuevo
// una vez a quienes ya la vieron.
export const VERSION_GUIA = 2;

export const PASOS_GUIA_NUTRICIONISTA = [
  {
    etiqueta: "Bienvenida",
    titulo: "Bienvenido a NutriApp",
    texto:
      "En un par de minutos te mostramos cómo crear menús semanales personalizados con IA, verificados con tablas de referencia y validados por ti. Incluye las novedades más recientes.",
  },
  {
    selector: "nuevo-paciente",
    titulo: "1. Registra a tu paciente",
    texto:
      "Peso, altura, edad, sexo, objetivo, actividad, alergias y preferencias. El presupuesto es opcional: si marcas «No», no se pedirán precios al añadir alimentos.",
  },
  {
    selector: "paciente-menu",
    titulo: "2. Agrega sus alimentos",
    texto:
      "Registra lo que el paciente tiene o puede comprar. Los nutrientes se buscan solos en USDA y en la tabla USFQ (Ecuador). El precio solo se pide si el paciente maneja presupuesto.",
  },
  {
    selector: "paciente-tarjeta",
    titulo: "3. Revisa si alcanzan",
    texto:
      "Si los alimentos o las cantidades no alcanzan para la meta de calorías y proteínas, verás un aviso en la tarjeta antes de generar el menú.",
  },
  {
    selector: "paciente-menu",
    titulo: "4. Genera el menú con IA",
    texto:
      "La IA arma los platos de la semana y el programa calcula calorías, nutrientes y costo con las tablas. El nombre de cada plato menciona todos sus ingredientes (ej. «ensalada de acelga con tomate»).",
  },
  {
    selector: "paciente-menu",
    titulo: "5. Ajusta cada comida",
    texto:
      "En «Ajustar comida» cambias ingredientes y cantidades; el nombre del plato se actualiza solo (acelga → espinaca). Con el ícono del vaso 🥤 agregas una bebida: si es preparada (jugo, batido, colada) eliges sus ingredientes y sus calorías se suman.",
  },
  {
    selector: "paciente-menu",
    titulo: "6. Explicación de preparación",
    texto:
      "Cada comida trae sus pasos de preparación, separados en «Plato» y «Bebida», con íconos para el paciente. Puedes corregirlos o rehacerlos con IA desde «Ver preparación».",
  },
  {
    selector: "paciente-menu",
    titulo: "7. Requerimiento y macronutrientes",
    texto:
      "Dentro del menú, a la izquierda verás la fórmula (Mifflin-St Jeor) con el cálculo paso a paso; debajo de las comidas, los macronutrientes en g, kcal y %. Con «Ajustar g/kg» cambias la proteína (ej. 1,6 g/kg para un deportista).",
  },
  {
    selector: "paciente-menu",
    titulo: "8. Aprueba el menú",
    texto: "Cuando estés conforme, apruébalo. El paciente solo ve menús que tú aprobaste.",
  },
  {
    selector: "paciente-cuerpo",
    titulo: "9. Composición corporal",
    texto:
      "En la tarjeta del paciente ves IMC, masa muscular, grasa y cintura con su nivel (bajo, bueno, alto). Se calculan con las medidas que registras en Seguimiento. Útil cuando el peso y el IMC no bastan, como en deportistas.",
  },
  {
    selector: "paciente-mas",
    titulo: "10. Seguimiento y exámenes",
    texto:
      "En «Seguimiento de peso» registras cada control: peso, medidas corporales (opcional) y exámenes de laboratorio (glucosa, HbA1c, colesterol, triglicéridos, biometría). Cada valor sale como normal, límite o alto.",
  },
  {
    selector: "paciente-mas",
    titulo: "11. Dale acceso a su app",
    texto:
      "Crea el correo y la contraseña del paciente. Desde el celular verá su menú con la bebida y la preparación, marcará lo que come, registrará su peso y tendrá su lista de compras.",
  },
  {
    selector: "ver-guia",
    etiqueta: "Listo",
    titulo: "¡Eso es todo!",
    texto: "Puedes volver a ver esta guía cuando quieras con este botón.",
  },
];

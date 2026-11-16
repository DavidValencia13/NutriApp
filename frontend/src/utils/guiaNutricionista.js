// Pasos del recorrido guiado del nutricionista (siguen el flujo real del
// programa). selector = valor de data-tour del elemento que se ilumina.
export const PASOS_GUIA_NUTRICIONISTA = [
  {
    etiqueta: "Bienvenida",
    titulo: "Bienvenido a NutriApp",
    texto:
      "En menos de un minuto te mostramos cómo crear menús semanales personalizados con IA, verificados con tablas de referencia y validados por ti.",
  },
  {
    selector: "nuevo-paciente",
    titulo: "Registra a tu paciente",
    texto: "Empieza aquí: peso, altura, objetivo, nivel de actividad, presupuesto semanal, alergias y preferencias.",
  },
  {
    selector: "paciente-menu",
    titulo: "Agrega sus alimentos",
    texto:
      "Registra lo que el paciente tiene o puede comprar, con cantidad y precio. Los nutrientes se buscan solos en USDA FoodData Central y en la tabla de la USFQ para alimentos locales.",
  },
  {
    selector: "paciente-tarjeta",
    titulo: "Revisa si alcanzan",
    texto:
      "Si los alimentos o las cantidades no alcanzan para la meta de calorías y proteínas del paciente, verás un aviso en su tarjeta antes de generar el menú.",
  },
  {
    selector: "paciente-menu",
    titulo: "Genera el menú con IA",
    texto:
      "La IA arma los platos de la semana y el programa calcula calorías, nutrientes y costo con las tablas de referencia, ajustando porciones a la meta y al presupuesto.",
  },
  {
    selector: "paciente-menu",
    titulo: "Ajusta y aprueba",
    texto:
      "Revisa cada comida: puedes cambiar ingredientes y cantidades. Cuando estés conforme, apruébalo. El paciente solo ve menús que tú aprobaste.",
  },
  {
    selector: "paciente-mas",
    titulo: "Dale acceso a su app",
    texto:
      "Crea el correo y la contraseña del paciente. Desde el celular verá su menú, marcará lo que come, registrará su peso y tendrá su lista de compras.",
  },
  {
    selector: "paciente-mas",
    titulo: "Sigue su avance",
    texto:
      "Aquí ves el cumplimiento del menú comida por comida, la evolución de su peso y los comentarios que deja el paciente.",
  },
  {
    selector: "ver-guia",
    etiqueta: "Listo",
    titulo: "¡Eso es todo!",
    texto: "Puedes volver a ver esta guía cuando quieras con este botón.",
  },
];

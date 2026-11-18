import { Blend, CookingPot, Droplets, Flame, Microwave, Salad, Slice, Soup, Utensils } from "lucide-react";

// Explicación de preparación de un plato: { pasos: [{ accion, texto, minutos }], minutosTotales }
export const ACCIONES = {
  lavar: { Icono: Droplets, nombre: "Lavar" },
  picar: { Icono: Slice, nombre: "Picar" },
  hervir: { Icono: Soup, nombre: "Hervir" },
  cocinar: { Icono: CookingPot, nombre: "Cocinar" },
  freir: { Icono: Flame, nombre: "Freír" },
  hornear: { Icono: Microwave, nombre: "Al horno" },
  licuar: { Icono: Blend, nombre: "Licuar" },
  mezclar: { Icono: Utensils, nombre: "Mezclar" },
  servir: { Icono: Salad, nombre: "Servir" },
};

export function tienePreparacion(comida) {
  return Boolean(comida?.preparacion?.pasos?.length);
}

export function textoMinutos(minutos) {
  const m = Number(minutos) || 0;
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

// Devuelve una copia del menú con las preparaciones { [idComida]: prep }
export function aplicarPreparaciones(menu, preparaciones) {
  if (!menu) return menu;
  return {
    ...menu,
    dias: (menu.dias || []).map((dia) => ({
      ...dia,
      comidas: (dia.comidas || []).map((c) =>
        Object.prototype.hasOwnProperty.call(preparaciones, c.id) ? { ...c, preparacion: preparaciones[c.id] } : c,
      ),
    })),
  };
}


// Debe coincidir exactamente con GRUPOS_ALIMENTICIOS del backend
// (backend/src/lib/Alimento/Dominio/Entidades/GruposAlimenticios.js)
export const GRUPOS_ALIMENTICIOS = [
  { value: "proteinas", label: "Proteínas" },
  { value: "carbohidratos", label: "Carbohidratos" },
  { value: "grasas_saludables", label: "Grasas saludables" },
  { value: "granos_cereales", label: "Granos y cereales" },
  { value: "frutas", label: "Frutas" },
  { value: "verduras_hortalizas", label: "Verduras y hortalizas" },
  { value: "lacteos", label: "Lácteos" },
  { value: "legumbres", label: "Legumbres" },
  { value: "frutos_secos_semillas", label: "Frutos secos y semillas" },
  { value: "bebidas", label: "Bebidas" },
  { value: "procesados", label: "Alimentos procesados" },
  { value: "suplementos", label: "Suplementos" },
];

export function labelGrupoAlimenticio(value) {
  return GRUPOS_ALIMENTICIOS.find((g) => g.value === value)?.label || value;
}

const API_BASE = "/api/paciente";

export async function calcularPreviewNutrientes(idPaciente, idMenu, alimentos) {
  const res = await fetch(
    `${API_BASE}/${idPaciente}/menu/${idMenu}/preview-nutrientes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alimentos }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

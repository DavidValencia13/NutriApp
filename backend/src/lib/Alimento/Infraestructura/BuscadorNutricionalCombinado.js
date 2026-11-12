const { ServicioExternoError } = require("../Dominio/Errores");

// Combina dos fuentes nutricionales: la principal (USDA FoodData Central)
// llena el formulario y la secundaria (tabla USFQ, alimentos de uso local)
// se usa cuando la principal no encuentra el alimento o no responde.
// Si las dos lo encuentran, la otra va en `alternativa` para que el
// nutriólogo pueda comparar y elegir.
class BuscadorNutricionalCombinado {
  constructor({ principal, secundario }) {
    this.principal = principal;
    this.secundario = secundario;
  }

  async buscar(nombreAlimento) {
    const [p, s] = await Promise.allSettled([
      this.principal.buscar(nombreAlimento),
      this.secundario.buscar(nombreAlimento),
    ]);

    const resultadoPrincipal = p.status === "fulfilled" ? p.value : null;
    const resultadoSecundario = s.status === "fulfilled" ? s.value : null;

    if (p.status === "rejected") {
      console.error("Fuente nutricional principal falló:", p.reason?.message);
    }
    if (s.status === "rejected") {
      console.error("Fuente nutricional secundaria falló:", s.reason?.message);
    }

    const elegido = resultadoPrincipal || resultadoSecundario;
    if (!elegido) {
      // Sin resultados porque las dos fallaron (no porque no existiera el
      // alimento): se propaga como falla del servicio externo
      if (p.status === "rejected" && s.status === "rejected") {
        throw p.reason instanceof ServicioExternoError
          ? p.reason
          : new ServicioExternoError("No se pudo consultar las fuentes nutricionales");
      }
      return null;
    }

    const otro = elegido === resultadoPrincipal ? resultadoSecundario : null;
    // El peso por unidad (estimado por la IA al traducir) no depende de la
    // tabla: se comparte con la alternativa
    const gramosPorUnidad = resultadoPrincipal?.gramosPorUnidad;
    return otro
      ? { ...elegido, alternativa: { ...otro, ...(gramosPorUnidad && !otro.gramosPorUnidad && { gramosPorUnidad }) } }
      : elegido;
  }
}

module.exports = BuscadorNutricionalCombinado;

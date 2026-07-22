const test = require("node:test");
const assert = require("node:assert/strict");

const AjustarComidaMenu = require("../AjustarComidaMenu");
const { NotFoundError, ConflictError, ValidationError } = require("../../Dominio/Errores");

const alimento = { id: "507f1f77bcf86cd799439011", nombre: "Arroz", unidadMedida: "g" };

function crearDependencias({ comida, actualizarLanza } = {}) {
  const menuRepository = {
    llamadas: [],
    async obtenerComidaConPropietario() {
      return comida !== undefined ? comida : { id: 1, idDiaMenu: 5, menu: { id: 1, idPaciente: 1, estado: "generado" } };
    },
    async actualizarComida(idComidaMenu, cambios) {
      if (actualizarLanza) throw actualizarLanza;
      this.llamadas.push({ idComidaMenu, cambios });
      return { id: idComidaMenu, ...cambios };
    },
  };

  return {
    menuRepository,
    listarAlimentosPorPaciente: { async ejecutar() { return [alimento]; } },
  };
}

test("lanza NotFoundError si la comida no existe", async () => {
  const deps = crearDependencias({ comida: null });
  const caso = new AjustarComidaMenu(deps);
  await assert.rejects(() => caso.ejecutar(1, 10, { calorias: 400, alimentos: [] }), NotFoundError);
});

test("lanza ConflictError si el menú ya está aprobado", async () => {
  const deps = crearDependencias({
    comida: { id: 1, idDiaMenu: 5, menu: { id: 1, idPaciente: 1, estado: "aprobado" } },
  });
  const caso = new AjustarComidaMenu(deps);
  await assert.rejects(
    () => caso.ejecutar(1, 10, { calorias: 400, alimentos: [{ idAlimento: alimento.id, cantidad: 100 }] }),
    ConflictError,
  );
  assert.equal(deps.menuRepository.llamadas.length, 0);
});

test("lanza ValidationError si el alimento no pertenece al paciente", async () => {
  const deps = crearDependencias();
  const caso = new AjustarComidaMenu(deps);
  await assert.rejects(
    () => caso.ejecutar(1, 10, { calorias: 400, alimentos: [{ idAlimento: "000000000000000000000000", cantidad: 100 }] }),
    ValidationError,
  );
});

test("caso feliz: snapshot correcto de nombre/unidad", async () => {
  const deps = crearDependencias();
  const caso = new AjustarComidaMenu(deps);
  await caso.ejecutar(1, 10, { calorias: 500, alimentos: [{ idAlimento: alimento.id, cantidad: 200 }] });

  const llamada = deps.menuRepository.llamadas[0];
  assert.equal(llamada.cambios.calorias, 500);
  assert.equal(llamada.cambios.alimentos[0].nombreAlimento, "Arroz");
  assert.equal(llamada.cambios.alimentos[0].cantidadUtilizada, 200);
});

test("propaga ConflictError si el repositorio detecta la carrera dentro de su propia transacción", async () => {
  const deps = crearDependencias({ actualizarLanza: new ConflictError("perdió la carrera") });
  const caso = new AjustarComidaMenu(deps);
  await assert.rejects(
    () => caso.ejecutar(1, 10, { calorias: 400, alimentos: [{ idAlimento: alimento.id, cantidad: 100 }] }),
    ConflictError,
  );
});

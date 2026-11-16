// Lista de compras de la semana: suma lo que pide cada comida del menú,
// alimento por alimento, para que el paciente sepa qué y cuánto comprar.
// Recibe el árbol del menú (dias → comidas → detalles).
//
// La suma exacta (ej. 0.3 de lechuga, 1.01 kg de carne) no es algo que se
// pueda comprar, así que cada alimento trae también una cantidad "de
// compra" redondeada como se vende: piezas enteras, kilos y litros en pasos
// prácticos.

// Paso de redondeo según la unidad y la cantidad
function pasoDeCompra(unidad, cantidad) {
  if (unidad === "unidad") return 1;
  if (unidad === "kg" || unidad === "l") return cantidad >= 1 ? 0.1 : 0.05; // 100 g / 50 g
  return null;
}

// Redondea hacia arriba al paso, con una tolerancia del 10% del paso para no
// subir por un pelito (1.01 kg -> 1 kg, 2.02 huevos -> 2, pero 0.3 lechuga -> 1)
function cantidadDeCompra(unidad, cantidad) {
  const paso = pasoDeCompra(unidad, cantidad);
  if (!paso || cantidad <= 0) return Math.round(cantidad * 100) / 100;
  const pasos = Math.max(1, Math.ceil(cantidad / paso - 0.1));
  return Math.round(pasos * paso * 100) / 100;
}

const FRACCIONES = [
  [0.25, "un cuarto"],
  [1 / 3, "un tercio"],
  [0.5, "la mitad"],
  [2 / 3, "dos tercios"],
  [0.75, "tres cuartos"],
];

// Nota cuando se compra una pieza pero el menú usa solo una parte
function notaDeUso(unidad, cantidad, compra) {
  if (unidad !== "unidad" || cantidad >= 1 || compra !== 1) return null;
  const [, texto] = FRACCIONES.reduce((mejor, f) => (Math.abs(f[0] - cantidad) < Math.abs(mejor[0] - cantidad) ? f : mejor));
  return `usarás ${texto}`;
}

function listaDeCompras(menu) {
  const porAlimento = new Map();
  for (const dia of menu?.dias || []) {
    for (const comida of dia.comidas || []) {
      for (const d of comida.detalles || []) {
        const clave = `${d.idAlimento}|${d.unidadMedida}`;
        const actual = porAlimento.get(clave) || {
          idAlimento: d.idAlimento,
          nombre: d.nombreAlimento,
          unidadMedida: d.unidadMedida,
          cantidad: 0,
          costo: 0,
        };
        actual.cantidad += Number(d.cantidadUtilizada) || 0;
        actual.costo += Number(d.costoTotal) || 0;
        porAlimento.set(clave, actual);
      }
    }
  }
  return [...porAlimento.values()]
    .map((a) => {
      const cantidad = Math.round(a.cantidad * 100) / 100;
      const cantidadCompra = cantidadDeCompra(a.unidadMedida, cantidad);
      return {
        ...a,
        cantidad,
        cantidadCompra,
        nota: notaDeUso(a.unidadMedida, cantidad, cantidadCompra),
        costo: Math.round(a.costo * 100) / 100,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

module.exports = { listaDeCompras, cantidadDeCompra };

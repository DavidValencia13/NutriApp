const { ValidationError } = require("../Errores");

// Lo que el paciente marca en cada comida del menú: si la comió completa,
// solo una parte o no la comió, con una nota opcional ("no me gustó...")
const ESTADOS_COMIDA = ["si", "parte", "no"];
const LARGO_MAXIMO_NOTA = 300;

class MarcaComida {
  constructor({ id, idPaciente, idComidaMenu, estado, nota, fecha }) {
    if (!ESTADOS_COMIDA.includes(estado))
      throw new ValidationError(`El estado debe ser uno de: ${ESTADOS_COMIDA.join(", ")}`);

    const textoNota = nota ? String(nota).trim() : "";
    if (textoNota.length > LARGO_MAXIMO_NOTA)
      throw new ValidationError(`La nota no puede pasar de ${LARGO_MAXIMO_NOTA} caracteres`);

    this.id = id;
    this.idPaciente = Number(idPaciente);
    this.idComidaMenu = Number(idComidaMenu);
    this.estado = estado;
    this.nota = textoNota || null;
    this.fecha = fecha || new Date();
  }
}

module.exports = MarcaComida;
module.exports.ESTADOS_COMIDA = ESTADOS_COMIDA;

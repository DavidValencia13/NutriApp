class IGeneradorMenuIA {
  async generar({ perfilPaciente, alimentosDisponibles }) {}
  // Devuelve { dias: [{ numeroDia, comidas: [{ orden, tipoComida, calorias, alimentos: [{ idAlimento, cantidad }] }] }], recomendacion } ya validado técnicamente.
}

module.exports = IGeneradorMenuIA;

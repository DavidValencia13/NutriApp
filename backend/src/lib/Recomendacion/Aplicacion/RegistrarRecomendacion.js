const Recomendacion = require("../Dominio/Entidades/Recomendacion");

class RegistrarRecomendacion {
  constructor(recomendacionRepository) {
    this.recomendacionRepository = recomendacionRepository;
  }

  async ejecutar(data, { contextoPersistencia } = {}) {
    const recomendacion = new Recomendacion(data);
    return await this.recomendacionRepository.crear(recomendacion, { contextoPersistencia });
  }
}

module.exports = RegistrarRecomendacion;

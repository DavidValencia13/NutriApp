// Caso de uso: obtener nutriólogo por id
class ObtenerNutriologo {
  constructor(nutriologoRepository) {
    this.nutriologoRepository = nutriologoRepository;
  }

  async ejecutar(id) {
    const nutriologo = await this.nutriologoRepository.findById(id);
    if (!nutriologo) throw new Error("Nutriólogo no encontrado");
    return nutriologo;
  }
}

module.exports = ObtenerNutriologo;
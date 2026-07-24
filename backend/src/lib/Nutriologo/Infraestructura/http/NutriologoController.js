// Controller HTTP del Nutriólogo
// Recibe peticiones y las delega a los casos de uso
class NutriologoController {
  constructor({ registrarNutriologo, loginNutriologo, obtenerNutriologo }) {
    this.registrarNutriologo = registrarNutriologo;
    this.loginNutriologo = loginNutriologo;
    this.obtenerNutriologo = obtenerNutriologo;
  }

  // Registrar nuevo nutriólogo
  registrar = async (req, res) => {
    try {
      const nutriologo = await this.registrarNutriologo.ejecutar(req.body);
      res.status(201).json(this._aPublico(nutriologo));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  // Iniciar sesión
  login = async (req, res) => {
    try {
      const resultado = await this.loginNutriologo.ejecutar(req.body);
      res.json(resultado);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };

  // Obtener perfil del nutriólogo
  // Solo puede consultar su propio perfil (req.nutriologo lo deja authMiddleware)
  obtener = async (req, res) => {
    try {
      if (Number(req.params.id) !== req.nutriologo.id) {
        return res.status(403).json({ message: "No autorizado" });
      }
      const nutriologo = await this.obtenerNutriologo.ejecutar(req.params.id);
      res.json(this._aPublico(nutriologo));
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };

  // Quita campos sensibles (ej. password) antes de responder al cliente
  _aPublico({ id, nombre, apellido, email }) {
    return { id, nombre, apellido, email };
  }
}

module.exports = NutriologoController;

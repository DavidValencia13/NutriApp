// Controller HTTP del Nutriólogo
// Recibe peticiones y las delega a los casos de uso
class NutriologoController {
  constructor({ registrarNutriologo, loginNutriologo, obtenerNutriologo, actualizarWhatsappNutriologo, crearPacienteDemo, personalizarMarca }) {
    this.registrarNutriologo = registrarNutriologo;
    this.loginNutriologo = loginNutriologo;
    this.obtenerNutriologo = obtenerNutriologo;
    this.actualizarWhatsappNutriologo = actualizarWhatsappNutriologo;
    this.crearPacienteDemo = crearPacienteDemo;
    this.personalizarMarca = personalizarMarca;
  }

  // Registrar nuevo nutriólogo
  registrar = async (req, res) => {
    try {
      const nutriologo = await this.registrarNutriologo.ejecutar(req.body);
      // Cuenta nueva con un paciente de ejemplo listo para probar. Si falla,
      // la cuenta igual queda creada (lo puede cargar luego con el botón)
      if (this.crearPacienteDemo) {
        await this.crearPacienteDemo
          .ejecutar(nutriologo.id)
          .catch((e) => console.error("No se pudo crear el paciente de ejemplo:", e.message));
      }
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

  obtenerWhatsapp = async (req, res, next) => {
    try {
      const nutriologo = await this.obtenerNutriologo.ejecutar(req.nutriologo.id);
      res.json({ numero: nutriologo.whatsappNumero || null });
    } catch (error) {
      if (error.message === "Nutriólogo no encontrado") error.statusCode = 404;
      next(error);
    }
  };

  actualizarWhatsapp = async (req, res, next) => {
    try {
      res.json(await this.actualizarWhatsappNutriologo.ejecutar(req.nutriologo.id, req.body?.numero));
    } catch (error) {
      next(error);
    }
  };

  obtenerMarca = async (req, res, next) => {
    try {
      res.json(await this.personalizarMarca.obtener(req.nutriologo.id));
    } catch (error) {
      next(error);
    }
  };

  guardarMarca = async (req, res, next) => {
    try {
      res.json(await this.personalizarMarca.guardar(req.nutriologo.id, req.body || {}));
    } catch (error) {
      next(error);
    }
  };

  // Quita campos sensibles (ej. password) antes de responder al cliente
  _aPublico({ id, nombre, apellido, email }) {
    return { id, nombre, apellido, email };
  }
}

module.exports = NutriologoController;

class PacienteController {
  constructor({
    registrarPaciente,
    editarPaciente,
    eliminarPaciente,
    listarPacientes,
    crearPacienteDemo,
  }) {
    this.registrarPaciente = registrarPaciente;
    this.editarPaciente = editarPaciente;
    this.eliminarPaciente = eliminarPaciente;
    this.listarPacientes = listarPacientes;
    this.crearPacienteDemo = crearPacienteDemo;
  }

  // Crea el paciente de ejemplo (si el nutricionista todavía no lo tiene)
  crearDemo = async (req, res, next) => {
    try {
      const paciente = await this.crearPacienteDemo.ejecutar(req.nutriologo.id);
      if (!paciente) return res.status(409).json({ message: "Ya tienes el paciente de ejemplo" });
      res.status(201).json(paciente);
    } catch (error) {
      next(error);
    }
  };

  registrar = async (req, res) => {
    try {
      // req.nutriologo.id viene del token (lo dejó el authMiddleware)
      const paciente = await this.registrarPaciente.ejecutar({
        ...req.body,
        idNutriologo: req.nutriologo.id,
      });
      res.status(201).json(paciente);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  editar = async (req, res) => {
    try {
      const paciente = await this.editarPaciente.ejecutar(
        req.params.id,
        req.nutriologo.id,
        req.body,
      );
      res.json(paciente);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  eliminar = async (req, res) => {
    try {
      await this.eliminarPaciente.ejecutar(req.params.id, req.nutriologo.id);
      res.status(204).send(); // 204 = éxito sin contenido que devolver
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  listar = async (req, res) => {
    try {
      const pacientes = await this.listarPacientes.ejecutar(req.nutriologo.id);
      res.json(pacientes);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
}

module.exports = PacienteController;

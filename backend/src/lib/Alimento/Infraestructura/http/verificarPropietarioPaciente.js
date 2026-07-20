// Middleware (factory): verifica que :idPaciente exista y pertenezca al
// nutriólogo logueado (req.nutriologo la deja authMiddleware) antes de dejar
// pasar cualquier operación sobre los alimentos de ese paciente.
//
// También valida el FORMATO de idPaciente antes de consultarlo: un valor no
// numérico (ej. "abc") llegaría tal cual a Sequelize y Postgres lo rechaza
// en ejecución (SequelizeDatabaseError), lo que sin este chequeo terminaría
// como 500 en vez de 400.
module.exports = (pacienteRepository) => async (req, res, next) => {
  try {
    const idPacienteNum = Number(req.params.idPaciente);
    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0) {
      return res
        .status(400)
        .json({ message: "El id del paciente no es válido" });
    }

    const paciente = await pacienteRepository.findById(idPacienteNum);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    if (paciente.idNutriologo !== req.nutriologo.id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Valor ya validado y normalizado, para que el controller no repita la conversión
    req.idPaciente = idPacienteNum;
    next();
  } catch (error) {
    next(error); // errores inesperados -> error handler global (500)
  }
};

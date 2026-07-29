const { AppError } = require("../../Dominio/Errores");
const { sumarNutrientes } = require("../../Dominio/Servicios/CalculadoraNutricional");

class MenuController {
  constructor({ generarMenuSemanal, obtenerMenuPorPaciente, ajustarComidaMenu, aprobarMenu, listarMenusPorPaciente }) {
    this.generarMenuSemanal = generarMenuSemanal;
    this.obtenerMenuPorPaciente = obtenerMenuPorPaciente;
    this.ajustarComidaMenu = ajustarComidaMenu;
    this.aprobarMenu = aprobarMenu;
    this.listarMenusPorPaciente = listarMenusPorPaciente;
  }

  generar = async (req, res, next) => {
    try {
      const menu = await this.generarMenuSemanal.ejecutar(req.idPaciente, req.nutriologo.id);
      res.status(201).json(menu);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  obtener = async (req, res, next) => {
    try {
      const menu = await this.obtenerMenuPorPaciente.ejecutar(req.idPaciente, req.nutriologo.id);
      if (!menu) return res.json(menu);

      // Semana/dieta completa no se persiste aparte: se deriva sumando los
      // nutrientes de los 7 días ya cargados en el árbol.
      const menuPlano = menu.toJSON();
      menuPlano.resumenNutricionalSemanal = sumarNutrientes(
        (menuPlano.dias || []).map((d) => d.nutrientes),
      );
      res.json(menuPlano);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  ajustar = async (req, res, next) => {
    try {
      const idComidaMenu = Number(req.params.idComidaMenu);
      if (!Number.isInteger(idComidaMenu) || idComidaMenu <= 0) {
        return res.status(400).json({ message: "El id de la comida no es válido" });
      }
      const comida = await this.ajustarComidaMenu.ejecutar(idComidaMenu, req.nutriologo.id, req.body);
      res.json(comida);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  historial = async (req, res, next) => {
    try {
      const menus = await this.listarMenusPorPaciente.ejecutar(req.idPaciente, req.nutriologo.id);
      res.json(menus);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  aprobar = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      if (!Number.isInteger(idMenu) || idMenu <= 0) {
        return res.status(400).json({ message: "El id del menú no es válido" });
      }
      const resultado = await this.aprobarMenu.ejecutar(idMenu, req.nutriologo.id, {
        confirmarAdvertencias: req.body?.confirmarAdvertencias === true,
      });
      // requiereConfirmacion=true: NO se aprobó, el frontend debe reintentar
      // con confirmarAdvertencias:true si el nutriólogo decide continuar.
      res.json(resultado);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  _manejarError(error, res, next) {
    if (error instanceof AppError) {
      const body = { message: error.message };
      if (error.alertas) body.alertas = error.alertas;
      return res.status(error.statusCode).json(body);
    }
    next(error);
  }
}

module.exports = MenuController;

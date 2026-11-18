const { AppError } = require("../../Dominio/Errores");
const { sumarNutrientes } = require("../../Dominio/Servicios/CalculadoraNutricional");

class MenuController {
  constructor({ generarMenuSemanal, obtenerMenuPorPaciente, ajustarComidaMenu, aprobarMenu, calcularNutrientesPreviewComida, explicarPreparacionMenu, asignarBebidaComida, obtenerRequerimiento }) {
    this.generarMenuSemanal = generarMenuSemanal;
    this.obtenerMenuPorPaciente = obtenerMenuPorPaciente;
    this.ajustarComidaMenu = ajustarComidaMenu;
    this.aprobarMenu = aprobarMenu;
    this.calcularNutrientesPreviewComida = calcularNutrientesPreviewComida;
    this.explicarPreparacionMenu = explicarPreparacionMenu;
    this.asignarBebidaComida = asignarBebidaComida;
    this.obtenerRequerimiento = obtenerRequerimiento;
  }

  generar = async (req, res, next) => {
    try {
      const menu = await this.generarMenuSemanal.ejecutar(req.idPaciente, req.nutriologo.id, {
        confirmarNuevaVersion: req.body?.confirmarNuevaVersion === true,
        idVersionActual: req.body?.idVersionActual ?? null,
      });
      res.status(201).json(menu);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  obtener = async (req, res, next) => {
    try {
      const menu = await this.obtenerMenuPorPaciente.ejecutar(req.idPaciente, req.nutriologo.id);
      if (!menu) return res.json(menu);
      res.json(this._conResumenNutricional(menu));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  historial = async (req, res, next) => {
    try {
      res.json(await this.obtenerMenuPorPaciente.listarHistorial(req.idPaciente, req.nutriologo.id));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  obtenerVersion = async (req, res, next) => {
    try {
      const menu = await this.obtenerMenuPorPaciente.obtenerVersion(req.idPaciente, req.params.idMenu, req.nutriologo.id);
      res.json(this._conResumenNutricional(menu));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  _conResumenNutricional(menu) {
    const menuPlano = menu.toJSON();
    menuPlano.resumenNutricionalSemanal = sumarNutrientes((menuPlano.dias || []).map((dia) => dia.nutrientes));
    return menuPlano;
  }

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

  previewNutrientes = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      if (!Number.isInteger(idMenu) || idMenu <= 0) {
        return res.status(400).json({ message: "El id del menú no es válido" });
      }
      const resultado = await this.calcularNutrientesPreviewComida.ejecutar(
        idMenu,
        req.nutriologo.id,
        req.body?.alimentos || [],
      );
      res.json(resultado);
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
      const resultado = await this.aprobarMenu.ejecutar(idMenu, req.nutriologo.id);
      res.json(resultado);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  generarPreparacion = async (req, res, next) => {
    try {
      const idMenu = Number(req.params.idMenu);
      if (!Number.isInteger(idMenu) || idMenu <= 0) {
        return res.status(400).json({ message: "El id del menú no es válido" });
      }
      const resultado = await this.explicarPreparacionMenu.generar(idMenu, req.nutriologo.id, {
        regenerar: req.body?.regenerar === true,
        idsComidas: Array.isArray(req.body?.idsComidas) ? req.body.idsComidas.slice(0, 50) : null,
      });
      res.json(resultado);
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  editarPreparacion = async (req, res, next) => {
    try {
      const idComidaMenu = Number(req.params.idComidaMenu);
      if (!Number.isInteger(idComidaMenu) || idComidaMenu <= 0) {
        return res.status(400).json({ message: "El id de la comida no es válido" });
      }
      res.json(await this.explicarPreparacionMenu.editar(idComidaMenu, req.nutriologo.id, req.body?.preparacion ?? null));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  asignarBebida = async (req, res, next) => {
    try {
      const idComidaMenu = Number(req.params.idComidaMenu);
      if (!Number.isInteger(idComidaMenu) || idComidaMenu <= 0) {
        return res.status(400).json({ message: "El id de la comida no es válido" });
      }
      res.json(await this.asignarBebidaComida.ejecutar(idComidaMenu, req.nutriologo.id, req.body || {}));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  requerimiento = async (req, res, next) => {
    try {
      res.json(await this.obtenerRequerimiento(req.idPaciente));
    } catch (error) {
      this._manejarError(error, res, next);
    }
  };

  _manejarError(error, res, next) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = MenuController;

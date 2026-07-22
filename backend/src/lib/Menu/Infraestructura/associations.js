const PacienteModel = require("../../Paciente/Infraestructura/PacienteModel");
const MenuModel = require("./MenuModel");
const DiaMenuModel = require("./DiaMenuModel");
const ComidaMenuModel = require("./ComidaMenuModel");
const DetalleComidaAlimentoModel = require("./DetalleComidaAlimentoModel");

// Alias explícitos y cortos (as: "dias"/"comidas"/"detalles"/"dia"/"comida") en
// vez de dejar que Sequelize use el nombre de tabla por defecto
// (dias_menus/comidas_menus/detalle_comida_alimentos): con include anidado a 3
// niveles, Sequelize concatena los alias de asociación con puntos para nombrar
// cada columna en el SQL generado (ej. "dias_menus.comidas_menus.detalle_comida_alimentos.nombreAlimento"),
// y Postgres trunca esos identificadores a 63 bytes — con los nombres de tabla
// largos ese alias combinado los supera y el nombre de campo queda cortado en
// silencio (comprobado empíricamente: "nombreAlimento" llegaba como
// "nombreAliment", "cantidadUtilizada" como "cantidadUtili"). Con alias cortos
// el alias combinado más largo queda muy por debajo del límite.
MenuModel.belongsTo(PacienteModel, { foreignKey: "idPaciente", as: "paciente", onDelete: "CASCADE" });
PacienteModel.hasMany(MenuModel, { foreignKey: "idPaciente", as: "menus", onDelete: "CASCADE" });

MenuModel.hasMany(DiaMenuModel, { foreignKey: "idMenu", as: "dias", onDelete: "CASCADE" });
DiaMenuModel.belongsTo(MenuModel, { foreignKey: "idMenu", as: "menu" });

DiaMenuModel.hasMany(ComidaMenuModel, { foreignKey: "idDiaMenu", as: "comidas", onDelete: "CASCADE" });
ComidaMenuModel.belongsTo(DiaMenuModel, { foreignKey: "idDiaMenu", as: "dia" });

ComidaMenuModel.hasMany(DetalleComidaAlimentoModel, { foreignKey: "idComidaMenu", as: "detalles", onDelete: "CASCADE" });
DetalleComidaAlimentoModel.belongsTo(ComidaMenuModel, { foreignKey: "idComidaMenu", as: "comida" });

module.exports = {
  MenuModel,
  DiaMenuModel,
  ComidaMenuModel,
  DetalleComidaAlimentoModel,
  PacienteModel,
};

const PacienteModel = require("../../Paciente/Infraestructura/PacienteModel");
const MenuModel = require("./MenuModel");
const DiaMenuModel = require("./DiaMenuModel");
const ComidaMenuModel = require("./ComidaMenuModel");
const DetalleComidaAlimentoModel = require("./DetalleComidaAlimentoModel");

MenuModel.belongsTo(PacienteModel, { foreignKey: "idPaciente", onDelete: "CASCADE" });
PacienteModel.hasMany(MenuModel, { foreignKey: "idPaciente", onDelete: "CASCADE" });

MenuModel.hasMany(DiaMenuModel, { foreignKey: "idMenu", onDelete: "CASCADE" });
DiaMenuModel.belongsTo(MenuModel, { foreignKey: "idMenu" });

DiaMenuModel.hasMany(ComidaMenuModel, { foreignKey: "idDiaMenu", onDelete: "CASCADE" });
ComidaMenuModel.belongsTo(DiaMenuModel, { foreignKey: "idDiaMenu" });

ComidaMenuModel.hasMany(DetalleComidaAlimentoModel, { foreignKey: "idComidaMenu", onDelete: "CASCADE" });
DetalleComidaAlimentoModel.belongsTo(ComidaMenuModel, { foreignKey: "idComidaMenu" });

module.exports = {
  MenuModel,
  DiaMenuModel,
  ComidaMenuModel,
  DetalleComidaAlimentoModel,
  PacienteModel,
};

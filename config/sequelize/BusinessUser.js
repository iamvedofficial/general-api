const Sequelize = require("sequelize");

const db = require("./database");
const user = require("./User");
const business = require("./Business")

var modelDefinition = {
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: user,
      key: "id",
    },
    onDelete: 'cascade'
  },
  business_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: business,
      key: "id",
    },
    onDelete: 'cascade'
  },
};

const BusinessUserModel = db.define("Business_Users", modelDefinition);

module.exports = BusinessUserModel;

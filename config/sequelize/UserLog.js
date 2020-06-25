const Sequelize = require("sequelize");

const db = require("./database");
const user = require("./User");

var modelDefinition = {
  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: user,
      key: "id",
    },
  },
  user_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false,
  },
};

const UserLog = db.define("UserLog", modelDefinition);

module.exports = UserLog;

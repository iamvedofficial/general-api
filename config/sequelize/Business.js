
const Sequelize = require('sequelize');

const db = require('./database');

var modelDefinition = {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
    }
};


const BusinessModel = db.define('Business', modelDefinition);



module.exports = BusinessModel;

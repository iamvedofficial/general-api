// The User model.
const Sequelize = require('sequelize');

const config = require('../config');
const db = require('./database');

var modelDefinition = {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
    }
};


const BusinessModel = db.define('Business', modelDefinition);



module.exports = BusinessModel;

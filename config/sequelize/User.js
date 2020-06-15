// The User model.
const Sequelize = require('sequelize');

const config = require('../config');
const db = require('./database');

var modelDefinition = {
    username: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    mobile: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,
        allowNull: true
    },
    location: {
        type: Sequelize.STRING,
        allowNull: true
    },
    picture: {
        type: Sequelize.STRING,
        allowNull: true
    }
};


const UserModel = db.define('User', modelDefinition);



module.exports = UserModel;

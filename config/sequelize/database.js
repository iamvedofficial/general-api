const Sequelize = require('sequelize');
const config = require('../config');

const db = new Sequelize(
  config.dbName,
  config.dbUser,
  config.dbPass,
  config.details,
);

db
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = db;
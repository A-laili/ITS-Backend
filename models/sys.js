const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sys = sequelize.define('Sys', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// ...existing code if any...

module.exports = Sys;

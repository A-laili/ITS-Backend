const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NetworkSettings = sequelize.define('NetworkSettings', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    server: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    database: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = NetworkSettings;

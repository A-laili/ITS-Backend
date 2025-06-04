const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneralSettings = sequelize.define('GeneralSettings', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    imagePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    videoPath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    adminRole: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userRole: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hitDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    hitImageDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    readDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    readImageDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    eventDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    violationDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = GeneralSettings;

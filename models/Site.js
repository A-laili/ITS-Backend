const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Device = require('./Device');

const Site = sequelize.define('Site', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    coordinates: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    speedLimit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    speedLimitValue: {
        type: DataTypes.INTEGER,
        defaultValue: 40,
        validate: {
            min: 1
        }
    },
    seatbelt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    phoneUsage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Device,
            key: 'id'
        }
    }
});

Device.hasMany(Site, { foreignKey: 'deviceId' });
Site.belongsTo(Device, { foreignKey: 'deviceId' });


module.exports = Site;

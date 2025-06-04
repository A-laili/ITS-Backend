const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Drivers = require('./Drivers');
const Violation = require('../Hazen/hazen_models/Violation');

const PV_violation = sequelize.define('PV_violation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },

    //violaton Informations

    violationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Violation,  // Reference the model directly instead of table name
            key: 'id'
        }
    },
    violationTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sitename: {
        type: DataTypes.STRING,
        allowNull: true
    },
    violationType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Driver Information
    driverid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Drivers',
            key: 'id'
        }
    },
    driver: {
        type: DataTypes.STRING,
        allowNull: true
    },
    driver_init_points: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    driver_final_points: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    driver_points_lost: {
        type: DataTypes.INTEGER,
        allowNull: true
    },


    //ticket Information
    ticketref: {
        type: DataTypes.STRING,
        defaultValue: 'N/A',
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'open',
        allowNull: true
    },
    sendto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notification: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    notificationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    tableName: 'PV_violations',
    timestamps: true
});

// Define associations
User.hasMany(PV_violation, { 
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
PV_violation.belongsTo(User, { foreignKey: 'userId' });

Drivers.hasMany(PV_violation, {
    foreignKey: 'driverid',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});
PV_violation.belongsTo(Drivers, { foreignKey: 'driverid' });

Violation.hasMany(PV_violation, {
    foreignKey: 'violationId',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});
PV_violation.belongsTo(Violation, { foreignKey: 'violationId' });

// Remove individual sync - this will be handled by database.js
module.exports = PV_violation;

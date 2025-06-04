const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    accessRights: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify({
            administration: false,
            Repports: false,
            Dashboard: false,
            Drivers: false,
            Vehicles: false,
            Clients: false,
            Users: false,
            Settings: false
        }),
        get() {
            const rawValue = this.getDataValue('accessRights');
            return JSON.parse(rawValue);
        },
        set(value) {
            this.setDataValue('accessRights', JSON.stringify(value));
        }
    }
});

module.exports = Role;

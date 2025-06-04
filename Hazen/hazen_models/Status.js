const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // adjust path as needed

const Status = sequelize.define('Status', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    device: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('unknown', 'warmup', 'normal', 'fault', 'connectionLost', 'deviceUp'),
        allowNull: false,
        defaultValue: 'unknown'
    }
}, {
    tableName: 'HazenStatus',
    timestamps: true
});

Status.sync()
    .then(() => console.log('HazenStatus table ensured'))
    .catch(err => console.error('Error ensuring HazenStatus table:', err));

module.exports = Status;

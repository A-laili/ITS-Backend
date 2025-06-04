const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const FullImage = sequelize.define('FullImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    device: { type: DataTypes.STRING, allowNull: true },
    fileName: { type: DataTypes.STRING, allowNull: false },
    format: { type: DataTypes.STRING, allowNull: false },
    image: { 
        // stores a base64EncodedImage as text
        type: DataTypes.TEXT,
        allowNull: false 
    }
}, {
    tableName: 'HazenFullImage',
    timestamps: true
});

FullImage.sync()
    .then(() => console.log('HazenFullImage table ensured'))
    .catch(err => console.error('Error ensuring HazenFullImage table:', err));

module.exports = FullImage;

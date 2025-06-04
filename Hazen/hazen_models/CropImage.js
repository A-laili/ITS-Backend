const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const CropImage = sequelize.define('CropImage', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		allowNull: false,
		primaryKey: true
	},
    device: { type: DataTypes.STRING, allowNull: true },
	fileName: { 
		type: DataTypes.STRING,
		allowNull: false 
	},
	format: { 
		type: DataTypes.STRING,
		allowNull: false 
	},
	image: { 
		// Changed field: stores a base64EncodedImage as text
		type: DataTypes.TEXT,
		allowNull: false 
	}
}, {
	tableName: 'HazenCropImage',
	timestamps: true
});

CropImage.sync()
	.then(() => console.log('HazenCropImage table ensured'))
	.catch(err => console.error('Error ensuring HazenCropImage table:', err));

module.exports = CropImage;

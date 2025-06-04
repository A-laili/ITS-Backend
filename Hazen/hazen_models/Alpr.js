const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // adjust path as needed

const Alpr = sequelize.define('Alpr', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    // Updated foreign key linking to Status device with null permitted on delete/update
    device: {type: DataTypes.STRING, allowNull: true},

    // Root level fields
    direction: { type: DataTypes.STRING, allowNull: true },
    eventId: { type: DataTypes.STRING, allowNull: true },
    fullImageFileName: { type: DataTypes.STRING, allowNull: true },
    lpVisible: { type: DataTypes.BOOLEAN, allowNull: true },
    sitename: { type: DataTypes.STRING, allowNull: true},
    speedmph: { type: DataTypes.FLOAT, allowNull: true },
    timestampUnixMs: { type: DataTypes.BIGINT, allowNull: true },
    
    // lpData fields
    lp_country: { type: DataTypes.STRING, allowNull: true },
    lp_countryConfidence: { type: DataTypes.FLOAT, allowNull: true },
    lp_lpCropImage: { type: DataTypes.STRING, allowNull: true },
    lp_lpOcr: { type: DataTypes.STRING, allowNull: true },
    lp_lpOcrConfidence: { type: DataTypes.FLOAT, allowNull: true },
    lp_plateCategory: { type: DataTypes.STRING, allowNull: true },
    lp_plateCategoryConf: { type: DataTypes.FLOAT, allowNull: true },
    
    // vehicleData fields
    vehicle_color: { type: DataTypes.STRING, allowNull: true },
    vehicle_colorConfidence: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_lpBb_BbConf: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_lpBb_h: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_lpBb_w: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_lpBb_x: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_lpBb_y: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_make: { type: DataTypes.STRING, allowNull: true },
    vehicle_makeConfidence: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_model: { type: DataTypes.STRING, allowNull: true },
    vehicle_modelConfidence: { type: DataTypes.FLOAT, allowNull: true },
    // note: using 'vechicleBb' as in original JSON
    vehicle_vechicleBb_BbConf: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_h: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_w: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_x: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_y: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vehicleImageFileName: { type: DataTypes.STRING, allowNull: true },
    vehicle_vehicleType: { type: DataTypes.STRING, allowNull: true },
    vehicle_vehicleTypeConf: { type: DataTypes.FLOAT, allowNull: true }
}, {
    tableName: 'HazenAlpr',
    timestamps: true
});

Alpr.sync()
    .then(() => console.log('HazenAlpr table ensured'))
    .catch(err => console.error('Error ensuring HazenAlpr table:', err));

module.exports = Alpr;

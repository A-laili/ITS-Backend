const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // adjust path as needed

const Violation = sequelize.define('Violation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    // Updated foreign key linking to Status device with null permitted on delete/update
    device: { type: DataTypes.STRING, allowNull: true },

    eventId: { type: DataTypes.STRING, allowNull: true },
    sitename: { type: DataTypes.STRING, allowNull: true },
    timestampUnixMs: { type: DataTypes.BIGINT, allowNull: true },

    // alprData fields from violation JSON
    direction: { type: DataTypes.STRING, allowNull: true },
    lpVisible: { type: DataTypes.BOOLEAN, allowNull: true },
    speedmph: { type: DataTypes.FLOAT, allowNull: true },

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
    vehicle_vechicleBb_BbConf: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_h: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_w: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_x: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vechicleBb_y: { type: DataTypes.FLOAT, allowNull: true },
    vehicle_vehicleImageFileName: { type: DataTypes.STRING, allowNull: true },
    vehicle_vehicleType: { type: DataTypes.STRING, allowNull: true },
    vehicle_vehicleTypeConf: { type: DataTypes.FLOAT, allowNull: true },

    // violationData fields
    violation_Bb_h: { type: DataTypes.FLOAT, allowNull: true },
    violation_Bb_w: { type: DataTypes.FLOAT, allowNull: true },
    violation_Bb_x: { type: DataTypes.FLOAT, allowNull: true },
    violation_Bb_y: { type: DataTypes.FLOAT, allowNull: true },
    violation_cShotImageFileName: { type: DataTypes.STRING, allowNull: true },
    violation_type: { type: DataTypes.STRING, allowNull: true },
    violation_violationVideoURI: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'HazenViolation',
    timestamps: true
});

Violation.sync()
    .then(() => console.log('HazenViolation table ensured'))
    .catch(err => console.error('Error ensuring HazenViolation table:', err));

module.exports = Violation;

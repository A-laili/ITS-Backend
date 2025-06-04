const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Drivers = sequelize.define('Drivers', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    licenseNumber: {
        type: DataTypes.STRING,
        allowNull: true
        // Removed unique constraint
    },
    licenseClass: {
        type: DataTypes.STRING,
        allowNull: true
    },
    licenseExpiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmailOrEmpty(value) {
                if (value && value.length > 0 && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                    throw new Error('Invalid email address');
                }
            }
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    employmentStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
    },
    hireDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    externalId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'External ID for integration purposes (e.g., Genetec GUID)'
    },
    metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('metadata');
            return value ? JSON.parse(value) : {};
        },
        set(value) {
            this.setDataValue('metadata', JSON.stringify(value || {}));
        },
        defaultValue: '{}',
        comment: 'Additional metadata from external systems (stored as JSON string)'
    }
}, {
    hooks: {
        beforeSave: (instance) => {
            // Ensure metadata is properly stringified before save
            if (instance.metadata && typeof instance.metadata !== 'string') {
                instance.metadata = JSON.stringify(instance.metadata);
            }
        },
        afterFind: (instances) => {
            // Parse metadata after fetching
            if (!instances) return;
            const instanceArray = Array.isArray(instances) ? instances : [instances];
            instanceArray.forEach(instance => {
                if (instance.metadata && typeof instance.metadata === 'string') {
                    try {
                        instance.metadata = JSON.parse(instance.metadata);
                    } catch (e) {
                        instance.metadata = {};
                    }
                }
            });
        }
    }
});

module.exports = Drivers;

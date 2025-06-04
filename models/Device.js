const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isIP: true,
      notEmpty: true
    }
  },
  macAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      notEmpty: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  password: {
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
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deviceType: {
    type: DataTypes.STRING,
    defaultValue: 'camera',
    validate: {
      notEmpty: true
    }
  },
  additionalSettings: {
    type: DataTypes.TEXT,  // Changed from JSON to TEXT
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('additionalSettings');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('additionalSettings', value ? JSON.stringify(value) : null);
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (device) => {
      // Convert MAC address to standardized format
      if (device.macAddress) {
        device.macAddress = device.macAddress.toUpperCase();
      }
    }
  }
});

// Instance methods
Device.prototype.updateOnlineStatus = async function(status) {
  if (status) {
    this.lastSeen = new Date();
  }
  this.isOnline = status;
  return this.save();
};

// Add getter/setter helpers for additionalSettings
Device.prototype.getAdditionalSettings = function() {
  return this.additionalSettings;
};

Device.prototype.setAdditionalSettings = function(settings) {
  this.additionalSettings = settings;
  return this.save();
};

// Static methods
Device.validateIpAddress = (ip) => {
  const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};

Device.validateMacAddress = (mac) => {
  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return regex.test(mac);
};

module.exports = Device;

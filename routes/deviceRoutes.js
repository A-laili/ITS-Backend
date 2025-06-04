const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Device = require('../models/Device');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateDevice = [
  body('name').notEmpty().trim().escape(),
  body('ipAddress').isIP().trim(),
  body('macAddress').matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  body('username').notEmpty().trim(),
  body('password').notEmpty(),
  body('coordinates').notEmpty().trim(),
  body('deviceType').optional().trim(),
];

// Get all devices
router.get('/', authMiddleware(), async (req, res) => {
  Device.findAll({
    attributes: { exclude: ['password'] }
  })
    .then(devices => {
      res.json(devices);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to fetch devices' });
    });
});

// Get single device by ID
router.get('/:id', authMiddleware(), async (req, res) => {
  Device.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  })
    .then(device => {
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to fetch device' });
    });
});

// Create new device
router.post('/', [authMiddleware(), ...validateDevice], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Device.findOne({
    where: {
      [Op.or]: [
        { ipAddress: req.body.ipAddress },
        { macAddress: req.body.macAddress }
      ]
    }
  })
    .then(existingDevice => {
      if (existingDevice) {
        return res.status(400).json({
          error: 'Device with this IP or MAC address already exists'
        });
      }
      return Device.create(req.body);
    })
    .then(device => {
      const deviceWithoutPassword = device.toJSON();
      delete deviceWithoutPassword.password;
      res.status(201).json(deviceWithoutPassword);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to create device' });
    });
});

// Update device
router.put('/:id', [authMiddleware(), ...validateDevice], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let updateDevice;
  Device.findByPk(req.params.id)
    .then(device => {
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      updateDevice = device;

      if (req.body.ipAddress !== device.ipAddress || 
          req.body.macAddress !== device.macAddress) {
        return Device.findOne({
          where: {
            [Op.or]: [
              { ipAddress: req.body.ipAddress },
              { macAddress: req.body.macAddress }
            ],
            id: { [Op.ne]: req.params.id }
          }
        });
      }
      return null;
    })
    .then(existingDevice => {
      if (existingDevice) {
        return res.status(400).json({
          error: 'Device with this IP or MAC address already exists'
        });
      }
      return updateDevice.update(req.body);
    })
    .then(device => {
      if (device) {
        const updatedDevice = device.toJSON();
        delete updatedDevice.password;
        res.json(updatedDevice);
      }
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to update device' });
    });
});

// Delete device
router.delete('/:id', authMiddleware(), async (req, res) => {
  Device.findByPk(req.params.id)
    .then(device => {
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      return device.destroy();
    })
    .then(() => {
      res.json({ message: 'Device deleted successfully' });
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to delete device' });
    });
});

// Update device online status
router.patch('/:id/status', authMiddleware(), async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    const isOnline = req.body.isOnline;
    await device.update({
        isOnline,
        lastSeen: isOnline ? new Date() : device.lastSeen
    });

    res.json({
        id: device.id,
        name: device.name,
        isOnline: device.isOnline,
        lastSeen: device.lastSeen
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
